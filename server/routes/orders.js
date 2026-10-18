
const express = require('express')
const crypto = require('crypto')
const pool = require('../db')
const requireCustomer = require('../middleware/auth')

const router = express.Router()

// Keep prices in EUR. Shipping is currently free.
const SHIPPING_FEE = 0

function makeOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = crypto.randomBytes(4).toString('hex').toUpperCase()

    return `CC-${timestamp}-${random}`
}

function validateShippingAddress(address) {
    if (!address || typeof address !== 'object' || Array.isArray(address)) {
        return 'Please provide a delivery address.'
    }

    const requiredFields = [
        ['full_name', 'Full name'],
        ['phone_number', 'Phone number'],
        ['address_line1', 'Street address'],
        ['city', 'City'],
        ['postal_code', 'Postal code'],
        ['country', 'Country'],
    ]

    for (const [field, label] of requiredFields) {
        if (
            typeof address[field] !== 'string' ||
            !address[field].trim()
        ) {
            return `${label} is required.`
        }
    }

    const limits = {
        full_name: 150,
        phone_number: 30,
        address_line1: 255,
        address_line2: 255,
        city: 100,
        state: 100,
        postal_code: 20,
        country: 100,
    }

    for (const [field, maxLength] of Object.entries(limits)) {
        if (
            address[field] != null &&
            (
                typeof address[field] !== 'string' ||
                address[field].trim().length > maxLength
            )
        ) {
            return `${field.replaceAll('_', ' ')} is too long or invalid.`
        }
    }

    return null
}

// =====================================================
// POST /api/orders
// Create an order from the authenticated customer's cart.
// =====================================================
router.post('/', requireCustomer, async (req, res) => {
    const customerId = req.user.id
    const address = req.body.shipping_address
    const addressError = validateShippingAddress(address)

    if (addressError) {
        return res.status(400).json({ message: addressError })
    }

    const client = await pool.connect()
    let transactionStarted = false

    try {
        await client.query('BEGIN')
        transactionStarted = true

        // Lock the customer's active cart so it cannot be checked out
        // concurrently by another request.
        const cartResult = await client.query(
            `SELECT id
             FROM carts
             WHERE customer_id = $1
               AND status = 'active'
             ORDER BY id
             LIMIT 1
             FOR UPDATE`,
            [customerId]
        )

        if (!cartResult.rows.length) {
            await client.query('ROLLBACK')
            transactionStarted = false

            return res.status(400).json({
                message: 'Your cart is empty. Add products before checkout.',
            })
        }

        const cartId = cartResult.rows[0].id

        // Lock the cart rows and products while checking stock and prices.
        const itemsResult = await client.query(
            `SELECT
                ci.id AS cart_item_id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.sku,
                p.image_url,
                p.price,
                p.stock_quantity,
                p.is_active
             FROM cart_items ci
             JOIN products p ON p.id = ci.product_id
             WHERE ci.cart_id = $1
             ORDER BY p.id
             FOR UPDATE OF ci, p`,
            [cartId]
        )

        const items = itemsResult.rows

        if (!items.length) {
            await client.query('ROLLBACK')
            transactionStarted = false

            return res.status(400).json({
                message: 'Your cart is empty. Add products before checkout.',
            })
        }

        // Validate availability and calculate totals using database prices.
        let subtotalCents = 0

        for (const item of items) {
            const quantity = Number(item.quantity)
            const price = Number(item.price)
            const stock = Number(item.stock_quantity)

            if (
                !item.is_active ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                !Number.isFinite(price) ||
                price < 0
            ) {
                throw Object.assign(
                    new Error(
                        `${item.name} is currently unavailable. Please review your cart.`
                    ),
                    { statusCode: 409 }
                )
            }

            if (stock < quantity) {
                throw Object.assign(
                    new Error(
                        `Not enough stock for ${item.name}. Please update your cart.`
                    ),
                    { statusCode: 409 }
                )
            }

            // Work in cents to avoid accumulating floating-point errors.
            const priceCents = Math.round(price * 100)
            item.price_cents = priceCents
            item.line_total_cents = priceCents * quantity
            subtotalCents += item.line_total_cents
        }

        const shippingCents = Math.round(SHIPPING_FEE * 100)
        const totalCents = subtotalCents + shippingCents

        const subtotal = (subtotalCents / 100).toFixed(2)
        const shippingFee = (shippingCents / 100).toFixed(2)
        const totalAmount = (totalCents / 100).toFixed(2)

        // Store a snapshot of the delivery address on the order.
        // Future profile-address changes will not alter this order.
        const orderResult = await client.query(
            `INSERT INTO orders (
                order_number,
                customer_id,
                status,
                payment_status,
                subtotal,
                shipping_fee,
                total_amount,
                shipping_full_name,
                shipping_phone,
                shipping_address_line1,
                shipping_address_line2,
                shipping_city,
                shipping_state,
                shipping_postal_code,
                shipping_country
             )
             VALUES (
                $1, $2, 'confirmed', 'pending',
                $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
             )
             RETURNING *`,
            [
                makeOrderNumber(),
                customerId,
                subtotal,
                shippingFee,
                totalAmount,
                address.full_name.trim(),
                address.phone_number.trim(),
                address.address_line1.trim(),
                address.address_line2?.trim() || null,
                address.city.trim(),
                address.state?.trim() || null,
                address.postal_code.trim(),
                address.country.trim(),
            ]
        )

        const order = orderResult.rows[0]

        for (const item of items) {
            const quantity = Number(item.quantity)

            await client.query(
                `INSERT INTO order_items (
                    order_id,
                    product_id,
                    product_name,
                    product_sku,
                    image_url,
                    quantity,
                    unit_price,
                    line_total
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    order.id,
                    item.product_id,
                    item.name,
                    item.sku || null,
                    item.image_url || null,
                    quantity,
                    (item.price_cents / 100).toFixed(2),
                    (item.line_total_cents / 100).toFixed(2),
                ]
            )

            // Reduce stock only if enough remains.
            const stockResult = await client.query(
                `UPDATE products
                 SET stock_quantity = stock_quantity - $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2
                   AND is_active = TRUE
                   AND stock_quantity >= $1
                 RETURNING id`,
                [quantity, item.product_id]
            )

            if (!stockResult.rowCount) {
                throw Object.assign(
                    new Error(
                        `Stock changed for ${item.name}. Please try checkout again.`
                    ),
                    { statusCode: 409 }
                )
            }
        }

        // Empty the cart only after all order items and stock updates succeed.
        await client.query(
            'DELETE FROM cart_items WHERE cart_id = $1',
            [cartId]
        )

        await client.query('COMMIT')
        transactionStarted = false

        return res.status(201).json({
            message: 'Your order has been placed successfully.',
            order: {
                ...order,
                subtotal: Number(order.subtotal),
                shipping_fee: Number(order.shipping_fee),
                total_amount: Number(order.total_amount),
            },
        })
    } catch (error) {
        if (transactionStarted) {
            await client.query('ROLLBACK')
        }

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message,
            })
        }

        console.error('Create order error:', error.message)

        return res.status(500).json({
            message: 'Could not place your order. Please try again.',
        })
    } finally {
        client.release()
    }
})

// =====================================================
// GET /api/orders
// Return only the authenticated customer's orders.
// =====================================================
router.get('/', requireCustomer, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                o.id,
                o.order_number,
                o.status,
                o.payment_status,
                o.subtotal,
                o.shipping_fee,
                o.total_amount,
                o.created_at,
                COUNT(oi.id)::int AS item_count
             FROM orders o
             LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE o.customer_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC, o.id DESC`,
            [req.user.id]
        )

        return res.json(
            result.rows.map(order => ({
                ...order,
                subtotal: Number(order.subtotal),
                shipping_fee: Number(order.shipping_fee),
                total_amount: Number(order.total_amount),
            }))
        )
    } catch (error) {
        console.error('Purchase history error:', error.message)

        return res.status(500).json({
            message: 'Could not load your purchase history.',
        })
    }
})

// =====================================================
// GET /api/orders/:id
// Return one order and its item snapshots.
// =====================================================
router.get('/:id', requireCustomer, async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json({
            message: 'Invalid order ID.',
        })
    }

    try {
        const orderResult = await pool.query(
            `SELECT *
             FROM orders
             WHERE id = $1 AND customer_id = $2`,
            [Number(req.params.id), req.user.id]
        )

        if (!orderResult.rows.length) {
            return res.status(404).json({
                message: 'Order not found.',
            })
        }

        const itemsResult = await pool.query(
            `SELECT
                id,
                product_id,
                product_name,
                product_sku,
                image_url,
                quantity,
                unit_price,
                line_total
             FROM order_items
             WHERE order_id = $1
             ORDER BY id`,
            [orderResult.rows[0].id]
        )

        const order = orderResult.rows[0]

        return res.json({
            order: {
                ...order,
                subtotal: Number(order.subtotal),
                shipping_fee: Number(order.shipping_fee),
                total_amount: Number(order.total_amount),
            },
            items: itemsResult.rows.map(item => ({
                ...item,
                unit_price: Number(item.unit_price),
                line_total: Number(item.line_total),
            })),
        })
    } catch (error) {
        console.error('Order details error:', error.message)

        return res.status(500).json({
            message: 'Could not load order details.',
        })
    }
})

module.exports = router
