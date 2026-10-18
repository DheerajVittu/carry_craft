const express = require('express')
const pool = require('../db')
const requireAdmin = require('../middleware/requireAdmin')

const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const router = express.Router()

// All endpoints in this router require an admin JWT.
router.use(requireAdmin)

// =====================================================
// PRODUCT IMAGE UPLOAD CONFIGURATION
// Images are saved in src/assets/bags/<categoryId>/
// =====================================================

const bagsDir = path.resolve(__dirname, '../../src/assets/bags')

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
]

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const categoryId = Number(req.body.category_id)

        if (
            !Number.isInteger(categoryId) ||
            categoryId < 1
        ) {
            return cb(
                new Error('Please select a valid category before uploading an image.')
            )
        }

        const categoryDir = path.join(bagsDir, String(categoryId))

        fs.mkdir(categoryDir, { recursive: true }, (error) => {
            if (error) return cb(error)
            cb(null, categoryDir)
        })
    },

    filename: (req, file, cb) => {
        const categoryId = Number(req.body.category_id)
        const categoryDir = path.join(bagsDir, String(categoryId))
        const extension = path.extname(file.originalname).toLowerCase()

        fs.readdir(categoryDir, (error, files) => {
            if (error) return cb(error)

            const highestId = files.reduce((max, filename) => {
                const match = filename.match(/^(\d+)\.(jpg|jpeg|png|webp)$/i)

                if (!match) return max

                return Math.max(max, Number(match[1]))
            }, 0)

            cb(null, `${highestId + 1}${extension}`)
        })
    },
})

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },

    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase()

        if (
            !allowedMimeTypes.includes(file.mimetype) ||
            !allowedExtensions.includes(extension)
        ) {
            return cb(
                new Error('Only JPG, PNG, and WebP images are allowed.')
            )
        }

        cb(null, true)
    },
})

// Handle upload errors without returning an HTML error page.
function handleUpload(req, res, next) {
    upload.single('image')(req, res, (error) => {
        if (error) {
            const status = error instanceof multer.MulterError ? 400 : 400

            return res.status(status).json({
                message: error.message || 'Image upload failed.',
            })
        }

        next()
    })
}

// Validate the product fields received from React.
function validateProduct(body) {
    const categoryId = Number(body.category_id)
    const price = Number(body.price)
    const stock = Number(body.stock_quantity)

    if (
        !Number.isInteger(categoryId) ||
        categoryId < 1
    ) {
        return 'Please select a valid category.'
    }

    if (!body.name || !body.name.trim()) {
        return 'Product name is required.'
    }

    if (!body.slug || !body.slug.trim()) {
        return 'Product slug is required.'
    }

    if (!body.sku || !body.sku.trim()) {
        return 'Product SKU is required.'
    }

    if (body.price === '' || !Number.isFinite(price) || price < 0) {
        return 'Enter a valid product price.'
    }

    if (
        body.stock_quantity === '' ||
        !Number.isInteger(stock) ||
        stock < 0
    ) {
        return 'Stock quantity must be a non-negative integer.'
    }

    for (const field of ['capacity_liters', 'weight_kg']) {
        if (
            body[field] !== undefined &&
            body[field] !== '' &&
            (!Number.isFinite(Number(body[field])) || Number(body[field]) < 0)
        ) {
            return `${field} must be a non-negative number.`
        }
    }

    return null
}

// =====================================================
// GET /api/admin/summary
// =====================================================

router.get('/summary', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM products) AS products,
                (SELECT COUNT(*) FROM customers) AS customers,
                (SELECT COUNT(*) FROM carts) AS carts,
                (SELECT COUNT(*) FROM cart_items) AS cart_items
        `)

        res.json(result.rows[0])
    } catch (error) {
        console.error('Admin summary error:', error.message)

        res.status(500).json({
            message: 'Could not load dashboard summary.',
        })
    }
})

// =====================================================
// GET /api/admin/products
// Includes active and inactive products.
// =====================================================

router.get('/products', async (req, res) => {
    try {
        const result = await pool.query(`
SELECT
p.id,
    p.name,
    p.slug,
    p.description,
    p.brand,
    p.sku,
    p.price,
    p.stock_quantity,
    p.color,
    p.material,
    p.capacity_liters,
    p.weight_kg,
    p.image_url,
    p.category_id,
    p.is_active,
    c.name AS category_display_name
FROM products p
LEFT JOIN categories c
ON c.id = p.category_id
ORDER BY p.id DESC
    `)

        res.json(result.rows)
    } catch (error) {
        console.error('Admin products error:', error.message)

        res.status(500).json({
            message: 'Could not load products.',
        })
    }
})

// =====================================================
// POST /api/admin/products
// Create a product and optionally upload its image.
// =====================================================

router.post('/products', handleUpload, async (req, res) => {
    const validationError = validateProduct(req.body)

    if (validationError) {
        if (req.file) fs.unlink(req.file.path, () => {})

        return res.status(400).json({
            message: validationError,
        })
    }

    const {
        category_id,
        name,
        slug,
        description,
        brand,
        sku,
        price,
        stock_quantity,
        color,
        material,
        capacity_liters,
        weight_kg,
        is_active,
    } = req.body

    // The browser can access the image through the Express /assets route.
    const imageUrl = req.file
        ? `/assets/bags/${Number(category_id)}/${req.file.filename}`
: null

try {
    // Confirm the category exists.
    const categoryResult = await pool.query(
        'SELECT id FROM categories WHERE id = $1',
        [Number(category_id)]
    )

    if (!categoryResult.rows.length) {
        if (req.file) fs.unlink(req.file.path, () => {})

        return res.status(400).json({
            message: 'The selected category does not exist.',
        })
    }

    const result = await pool.query(
        `
            INSERT INTO products (
                category_id,
                name,
                slug,
                description,
                brand,
                sku,
                price,
                stock_quantity,
                color,
                material,
                capacity_liters,
                weight_kg,
                image_url,
                is_active
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, $13, $14
            )
            RETURNING *
            `,
        [
            Number(category_id),
            name.trim(),
            slug.trim(),
            description || null,
            brand || null,
            sku.trim(),
            Number(price),
            Number(stock_quantity),
            color || null,
            material || null,
            capacity_liters === '' || capacity_liters == null
                ? null
                : Number(capacity_liters),
            weight_kg === '' || weight_kg == null
                ? null
                : Number(weight_kg),
            imageUrl,
            is_active === undefined
                ? true
                : is_active === true || is_active === 'true',
        ]
    )

    res.status(201).json({
        message: 'Product created successfully.',
        product: result.rows[0],
    })
} catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {})

    console.error('Create product error:', error.message)

    if (error.code === '23505') {
        return res.status(409).json({
            message: 'A product with this slug or SKU already exists.',
        })
    }

    if (error.code === '23503') {
        return res.status(400).json({
            message: 'The selected category does not exist.',
        })
    }

    res.status(500).json({
        message: 'Could not create product.',
    })
}
})

// =====================================================
// PUT /api/admin/products/:id
// Update product fields and optionally replace its image.
// =====================================================

router.put('/products/:id', handleUpload, async (req, res) => {
    const productId = Number(req.params.id)

    if (!Number.isInteger(productId) || productId < 1) {
        if (req.file) fs.unlink(req.file.path, () => {})

        return res.status(400).json({
            message: 'Invalid product ID.',
        })
    }

    const validationError = validateProduct(req.body)

    if (validationError) {
        if (req.file) fs.unlink(req.file.path, () => {})

        return res.status(400).json({
            message: validationError,
        })
    }

    const {
        category_id,
        name,
        slug,
        description,
        brand,
        sku,
        price,
        stock_quantity,
        color,
        material,
        capacity_liters,
        weight_kg,
        is_active,
    } = req.body

    try {
        const categoryResult = await pool.query(
            'SELECT id FROM categories WHERE id = $1',
            [Number(category_id)]
        )

        if (!categoryResult.rows.length) {
            if (req.file) fs.unlink(req.file.path, () => {})

            return res.status(400).json({
                message: 'The selected category does not exist.',
            })
        }

        const oldResult = await pool.query(
            'SELECT id, image_url FROM products WHERE id = $1',
            [productId]
        )

        if (!oldResult.rows.length) {
            if (req.file) fs.unlink(req.file.path, () => {})

            return res.status(404).json({
                message: 'Product not found.',
            })
        }

        const oldImageUrl = oldResult.rows[0].image_url

        const imageUrl = req.file
            ? `/assets/bags/${Number(category_id)}/${req.file.filename}`
            : oldImageUrl

        const result = await pool.query(
            `
            UPDATE products
            SET
                category_id = $1,
                name = $2,
                slug = $3,
                description = $4,
                brand = $5,
                sku = $6,
                price = $7,
                stock_quantity = $8,
                color = $9,
                material = $10,
                capacity_liters = $11,
                weight_kg = $12,
                image_url = $13,
                is_active = $14,
                updated_at = NOW()
            WHERE id = $15
            RETURNING *
            `,
            [
                Number(category_id),
                name.trim(),
                slug.trim(),
                description || null,
                brand || null,
                sku.trim(),
                Number(price),
                Number(stock_quantity),
                color || null,
                material || null,
                capacity_liters === '' || capacity_liters == null
                    ? null
                    : Number(capacity_liters),
                weight_kg === '' || weight_kg == null
                    ? null
                    : Number(weight_kg),
                imageUrl,
                is_active === undefined
                    ? true
                    : is_active === true || is_active === 'true',
                productId,
            ]
        )

        // Keep the old image file on disk. This avoids accidentally deleting
        // an image still referenced by another product.
        res.json({
            message: 'Product updated successfully.',
            product: result.rows[0],
        })
    } catch (error) {
        if (req.file) fs.unlink(req.file.path, () => {})

        console.error('Update product error:', error.message)

        if (error.code === '23505') {
            return res.status(409).json({
                message: 'A product with this slug or SKU already exists.',
            })
        }

        res.status(500).json({
            message: 'Could not update product.',
        })
    }
})

// =====================================================
// PATCH /api/admin/products/:id/deactivate
// Soft-deactivate a product instead of deleting it.
// =====================================================


router.patch('/products/:id/deactivate', async (req, res) => {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
            message: 'Invalid product ID.',
        });
    }

    try {
        const result = await pool.query(
            `UPDATE products
             SET is_active = FALSE
             WHERE id = $1
                 RETURNING id, is_active`,
            [productId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Product not found.',
            });
        }

        res.json({
            message: 'Product deactivated successfully.',
            product: result.rows[0],
        });
    } catch (error) {
        console.error('Deactivate product error:', error);

        res.status(500).json({
            message: 'Could not deactivate product.',
        });
    }
});


/**
 * PATCH /api/admin/products/:id/activate
 * Reactivate a previously deactivated product.
 */
router.patch('/products/:id/activate', async (req, res) => {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({
            message: 'Invalid product ID.',
        });
    }

    try {
        const result = await pool.query(
            `UPDATE products
             SET is_active = TRUE
             WHERE id = $1
             RETURNING id, is_active`,
            [productId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Product not found.',
            });
        }

        return res.json({
            message: 'Product activated successfully.',
            product: result.rows[0],
        });
    } catch (error) {
        console.error('Activate product error:', error);

        return res.status(500).json({
            message: 'Could not activate product.',
        });
    }
});


// =====================================================
// GET /api/admin/customers
// =====================================================

router.get('/customers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, email, full_name, phone_number
            FROM customers
            ORDER BY id DESC
        `)

        res.json(result.rows)
    } catch (error) {
        console.error('Admin customers error:', error.message)

        res.status(500).json({
            message: 'Could not load customers.',
        })
    }
})

// =====================================================
// GET /api/admin/customers/:customerId/cart
// =====================================================

router.get('/customers/:customerId/cart', async (req, res) => {
    const { customerId } = req.params

    if (!/^\d+$/.test(customerId)) {
        return res.status(400).json({
            message: 'Invalid customer ID.',
        })
    }

    try {
        const customerResult = await pool.query(
            `
            SELECT id, full_name, email
            FROM customers
            WHERE id = $1
            `,
            [Number(customerId)]
        )

        if (!customerResult.rows.length) {
            return res.status(404).json({
                message: 'Customer not found.',
            })
        }

        const cartsResult = await pool.query(
            `
            SELECT id
            FROM carts
            WHERE customer_id = $1
            ORDER BY id
            `,
            [Number(customerId)]
        )

        const cartIds = cartsResult.rows.map(cart => cart.id)

        if (!cartIds.length) {
            return res.json({
                customer: customerResult.rows[0],
                items: [],
                item_count: 0,
                total: 0,
            })
        }

        const itemsResult = await pool.query(
            `
            SELECT
                ci.cart_id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.brand,
                p.price,
                p.image_url,
                (ci.quantity * p.price) AS line_total
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            WHERE ci.cart_id = ANY($1::int[])
            ORDER BY ci.cart_id, ci.id
            `,
            [cartIds]
        )

        const items = itemsResult.rows.map(item => ({
            ...item,
            price: Number(item.price),
            line_total: Number(item.line_total),
        }))

        res.json({
            customer: customerResult.rows[0],
            items,
            item_count: items.reduce(
                (sum, item) => sum + Number(item.quantity),
                0
            ),
            total: Number(
                items.reduce(
                    (sum, item) => sum + item.line_total,
                    0
                ).toFixed(2)
            ),
        })
    } catch (error) {
        console.error('Admin customer cart error:', error.message)

        res.status(500).json({
            message: 'Could not load this customer cart.',
        })
    }
})

// =====================================================
// GET /api/admin/orders?search=
// Get all customer orders, with optional search
// =====================================================

router.get('/orders', async (req, res) => {
    const search = String(req.query.search || '').trim()

    try {
        const result = await pool.query(
            `
            SELECT
                o.id,
                o.order_number,
                o.status,
                o.payment_status,
                o.subtotal,
                o.shipping_fee,
                o.total_amount,
                o.created_at,
                o.shipping_full_name,
                o.shipping_phone,
                o.shipping_address_line1,
                o.shipping_address_line2,
                o.shipping_city,
                o.shipping_state,
                o.shipping_postal_code,
                o.shipping_country,
                c.full_name AS customer_name,
                c.email AS customer_email,
                COUNT(oi.id)::int AS item_count,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'product_name', oi.product_name,
                            'product_sku', oi.product_sku,
                            'image_url', oi.image_url,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'line_total', oi.line_total
                        )
                        ORDER BY oi.id
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'::json
                ) AS items
            FROM orders o
            JOIN customers c ON c.id = o.customer_id
            LEFT JOIN order_items oi ON oi.order_id = o.id
            WHERE
                $1 = ''
                OR o.order_number ILIKE '%' || $1 || '%'
                OR c.full_name ILIKE '%' || $1 || '%'
                OR c.email ILIKE '%' || $1 || '%'
            GROUP BY o.id, c.full_name, c.email
            ORDER BY o.created_at DESC, o.id DESC
            `,
            [search]
        )

        res.json(result.rows)
    } catch (error) {
        console.error('Admin orders error:', error)

        res.status(500).json({
            message: 'Could not load customer orders.',
        })
    }
})

// =====================================================
// Catch unexpected upload errors for routes using Multer.
// =====================================================

router.use((error, req, res, next) => {
    console.error('Admin route error:', error.message)

    if (res.headersSent) {
        return next(error)
    }

    res.status(400).json({
        message: error.message || 'Request failed.',
    })
})


/**
 * PATCH /api/admin/orders/:id/status
 * Update an order's status and/or payment status.
 */
router.patch('/orders/:id/status', async (req, res) => {
    const { status, payment_status } = req.body

    const allowedOrderStatuses = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
    ]

    const allowedPaymentStatuses = [
        'pending',
        'paid',
        'failed',
        'refunded',
    ]

    if (!/^\d+$/.test(req.params.id)) {
        return res.status(400).json({
            message: 'Invalid order ID.',
        })
    }

    // Require at least one status to be updated.
    if (status === undefined && payment_status === undefined) {
        return res.status(400).json({
            message: 'Provide an order status or payment status.',
        })
    }

    // Validate supplied values before updating the database.
    if (
        status !== undefined &&
        !allowedOrderStatuses.includes(status)
    ) {
        return res.status(400).json({
            message: 'Invalid order status.',
        })
    }

    if (
        payment_status !== undefined &&
        !allowedPaymentStatuses.includes(payment_status)
    ) {
        return res.status(400).json({
            message: 'Invalid payment status.',
        })
    }

    try {
        const result = await pool.query(
            `UPDATE orders
             SET
                 status = COALESCE($1, status),
                 payment_status = COALESCE($2, payment_status)
             WHERE id = $3
             RETURNING
                 id,
                 order_number,
                 status,
                 payment_status`,
            [
                status === undefined ? null : status,
                payment_status === undefined ? null : payment_status,
                Number(req.params.id),
            ]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Order not found.',
            })
        }

        return res.json({
            message: 'Order status updated successfully.',
            order: result.rows[0],
        })
    } catch (error) {
        console.error('Update order status error:', error.message)

        return res.status(500).json({
            message: 'Could not update order status.',
        })
    }
})


module.exports = router
