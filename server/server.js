
const path = require('path')
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const pool = require('./db')

const authRoutes = require('./routes/auth')
const categoryRoutes = require('./routes/categories')
const productRoutes = require('./routes/products')
const cartRoutes = require('./routes/cart')
const adminRoutes = require('./routes/admin')
const profileRoutes = require('./routes/profile')
const orderRoutes = require('./routes/orders')
const erpImportRoutes = require('./routes/erpImport')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT current_database() AS database'
    )

    res.json({
      message: 'Backend connected to PostgreSQL!',
      database: result.rows[0].database
    })
  } catch (error) {
    console.error('Database health check failed:', error.message)

    res.status(500).json({
      error: 'Database connection failed.'
    })
  }
})

// Serve product images
app.use(
  '/assets',
  express.static(path.join(__dirname, '../src/assets'))
)

// Authentication API
app.use('/api/auth', authRoutes)

// ERP product import API
app.use('/api/admin/erp-import', erpImportRoutes)

// Admin API
app.use('/api/admin', adminRoutes)

// Categories API
app.use('/api/categories', categoryRoutes)

// Customer profile API
app.use('/api/profile', profileRoutes)

// Products API
app.use('/api/products', productRoutes)

// Cart API
app.use('/api/cart', cartRoutes)

app.use('/api/orders', orderRoutes)


// 404 handler for unknown API endpoints
app.use('/api', (req, res) => {
  res.status(404).json({
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  })
})

// General error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error)

  res.status(500).json({
    message: 'Internal server error.'
  })
})

// Orders API — checkout and purchase history

// Start server
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
  console.log('Health endpoint: http://localhost:5000/api/health')
  console.log('Categories endpoint: http://localhost:5000/api/categories')
  console.log('Products endpoint: http://localhost:5000/api/products')
  console.log('Admin endpoint: http://localhost:5000/api/admin')
  console.log('Profile endpoint: http://localhost:5000/api/profile')
  console.log('Orders endpoint: http://localhost:5000/api/orders')
})
