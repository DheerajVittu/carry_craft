
const express = require('express')
const router = express.Router()
const pool = require('../db')

// GET /api/categories
// Return all categories for the admin product form
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name
      FROM categories
      ORDER BY name ASC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error('Fetch categories error:', error)

    res.status(500).json({
      message: 'Failed to fetch categories'
    })
  }
})

// GET /api/categories/backpacks/products
router.get('/:slug/products', async (req, res) => {
  try {
    const slug = req.params.slug

    const result = await pool.query(
        `SELECT p.*
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE LOWER(REPLACE(TRIM(c.name), ' ', '-')) = LOWER($1)
         AND p.is_active = TRUE
       ORDER BY p.id DESC`,
        [slug]
    )

    res.json({
      category: slug,
      count: result.rows.length,
      products: result.rows
    })
  } catch (error) {
    console.error('Category products error:', error)

    res.status(500).json({
      message: 'Failed to fetch category products'
    })
  }
})

module.exports = router
