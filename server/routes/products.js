
const express = require('express')
const router = express.Router()
const pool = require('../db')

// GET /api/products/test
// Test that the products router is registered
router.get('/test', (req, res) => {
  res.json({
    message: 'Products router is working!'
  })
})

// GET /api/products
// Fetch active products that are in stock
router.get('/', async (req, res) => {
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
        c.name AS category_name,
        c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c
        ON c.id = p.category_id
      WHERE p.is_active = TRUE
        AND p.stock_quantity > 0
      ORDER BY p.id DESC
      LIMIT 100
    `)

    res.json(result.rows)
  } catch (error) {
    console.error('Failed to fetch products:', error.message)

    res.status(500).json({
      message: 'Failed to fetch products.'
    })
  }
})

// GET /api/products/:id
// Fetch one product by database ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        message: 'Invalid product ID.'
      })
    }

    const result = await pool.query(
      `
        SELECT
          p.*,
          c.name AS category_name,
          c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c
          ON c.id = p.category_id
        WHERE p.id = $1
          AND p.is_active = TRUE
      `,
      [Number(id)]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Product not found.'
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Failed to fetch product details:', error.message)

    res.status(500).json({
      message: 'Failed to fetch product details.'
    })
  }
})

module.exports = router
