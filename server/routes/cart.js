
const express = require('express')
const router = express.Router()
const pool = require('../db')
const requireCustomer = require('../middleware/auth')

// Find or create the cart belonging to this customer.
// Locking the customer row helps serialize concurrent cart updates.
async function getOrCreateCart(client, customerId) {
    const customer = await client.query(
        'SELECT id FROM customers WHERE id = $1 FOR UPDATE',
        [customerId]
    )

    if (customer.rows.length === 0) {
        const error = new Error('Customer account not found.')
        error.status = 401
        throw error
    }

    let result = await client.query(
        `SELECT id
         FROM carts
         WHERE customer_id = $1
         ORDER BY id
             LIMIT 1
     FOR UPDATE`,
        [customerId]
    )

    if (result.rows.length > 0) {
        return result.rows[0].id
    }

    result = await client.query(
        `INSERT INTO carts (customer_id, session_id)
         VALUES ($1, $2)
             RETURNING id`,
        [customerId, `customer-${customerId}`]
    )

    return result.rows[0].id
}

// Return cart items with current product information.
async function readCart(client, cartId) {
    const result = await client.query(
    `SELECT
         ci.product_id,
         ci.quantity,
         ci.unit_price AS price,
         p.name,
         p.brand,
         p.image_url,
         p.stock_quantity,
         p.is_active,
         (ci.quantity * ci.unit_price) AS line_total
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.id`,
    [cartId]
)

    const items = result.rows.map(item => ({
        ...item,
        price: Number(item.price),
        line_total: Number(item.line_total)
    }))

    return {
        items,
        item_count: items.reduce((sum, item) => sum + item.quantity, 0),
        total: Number(
            items.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)
        )
    }
}

// GET /api/cart
// Get the current customer's cart.
router.get('/', requireCustomer, async (req, res) => {
    try {
        const client = await pool.connect()

        try {
            await client.query('BEGIN')

            const cartId = await getOrCreateCart(client, req.user.id)
            const cart = await readCart(client, cartId)

            await client.query('COMMIT')
            res.json(cart)
        } catch (error) {
            await client.query('ROLLBACK')
            throw error
        } finally {
            client.release()
        }
    } catch (error) {
        console.error('Get cart error:', error.message)
        res.status(error.status || 500).json({
            message: error.status ? error.message : 'Failed to load cart.'
        })
    }
})

// POST /api/cart/items
// Body: { "product_id": 12, "quantity": 1 }
router.post('/items', requireCustomer, async (req, res) => {
    const productId = req.body.product_id
    const quantity = req.body.quantity === undefined
        ? 1
        : req.body.quantity

    if (
        !/^\d+$/.test(String(productId ?? '')) ||
        Number(productId) <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json({
            message: 'A valid product_id and positive integer quantity are required.'
        })
    }

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const cartId = await getOrCreateCart(client, req.user.id)

        const productResult = await client.query(
            `SELECT id, name, price, stock_quantity
             FROM products
             WHERE id = $1 AND is_active = TRUE
                 FOR UPDATE`,
            [productId]
        )

        if (productResult.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({
                message: 'Product not found or unavailable.'
            })
        }

        const product = productResult.rows[0]

        const existingResult = await client.query(
            `SELECT quantity
             FROM cart_items
             WHERE cart_id = $1 AND product_id = $2
                 FOR UPDATE`,
            [cartId, productId]
        )

        const existingQuantity = existingResult.rows.length
            ? existingResult.rows[0].quantity
            : 0

        const newQuantity = existingQuantity + quantity

        if (newQuantity > product.stock_quantity) {
            await client.query('ROLLBACK')
            return res.status(400).json({
                message: `Only ${product.stock_quantity} unit(s) of this product are in stock.`
            })
        }

        if (existingResult.rows.length > 0) {
    await client.query(
        `UPDATE cart_items
         SET quantity = $1,
             unit_price = $4,
             updated_at = NOW()
         WHERE cart_id = $2 AND product_id = $3`,
        [newQuantity, cartId, productId, product.price]
    )
} else {
            await client.query(
    `INSERT INTO cart_items (
        cart_id,
        product_id,
        quantity,
        unit_price
    )
    VALUES ($1, $2, $3, $4)`,
    [cartId, productId, quantity, product.price]
)
        }

        const cart = await readCart(client, cartId)

        await client.query('COMMIT')

        res.json({
            message: 'Product added to cart.',
            ...cart
        })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Add to cart error:', error.message)

        res.status(error.status || 500).json({
            message: error.status ? error.message : 'Failed to add product to cart.'
        })
    } finally {
        client.release()
    }
})

// PATCH /api/cart/items/:productId
// Body: { "quantity": 2 }
router.patch('/items/:productId', requireCustomer, async (req, res) => {
    const { productId } = req.params
    const { quantity } = req.body

    if (
        !/^\d+$/.test(productId) ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0
    ) {
        return res.status(400).json({
            message: 'A valid product ID and positive integer quantity are required.'
        })
    }

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const cartId = await getOrCreateCart(client, req.user.id)

        const productResult = await client.query(
            `SELECT p.stock_quantity, p.is_active
             FROM products p
                      JOIN cart_items ci ON ci.product_id = p.id
             WHERE p.id = $1 AND ci.cart_id = $2
                 FOR UPDATE OF p, ci`,
            [productId, cartId]
        )

        if (productResult.rows.length === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({
                message: 'Product is not in your cart.'
            })
        }

        const product = productResult.rows[0]

        if (!product.is_active || quantity > product.stock_quantity) {
            await client.query('ROLLBACK')
            return res.status(400).json({
                message: `Quantity exceeds available stock (${product.stock_quantity}).`
            })
        }

        await client.query(
            `UPDATE cart_items
             SET quantity = $1
             WHERE cart_id = $2 AND product_id = $3`,
            [quantity, cartId, productId]
        )

        const cart = await readCart(client, cartId)

        await client.query('COMMIT')
        res.json({ message: 'Cart quantity updated.', ...cart })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Update cart error:', error.message)
        res.status(500).json({ message: 'Failed to update cart.' })
    } finally {
        client.release()
    }
})

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', requireCustomer, async (req, res) => {
    if (!/^\d+$/.test(req.params.productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' })
    }

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const cartId = await getOrCreateCart(client, req.user.id)

        const result = await client.query(
            `DELETE FROM cart_items
             WHERE cart_id = $1 AND product_id = $2`,
            [cartId, req.params.productId]
        )

        if (result.rowCount === 0) {
            await client.query('ROLLBACK')
            return res.status(404).json({
                message: 'Product is not in your cart.'
            })
        }

        const cart = await readCart(client, cartId)

        await client.query('COMMIT')
        res.json({ message: 'Product removed from cart.', ...cart })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Remove cart item error:', error.message)
        res.status(500).json({ message: 'Failed to remove product.' })
    } finally {
        client.release()
    }
})

module.exports = router
