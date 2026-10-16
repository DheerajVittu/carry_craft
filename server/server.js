
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
const profileRoutes = require('./routes/profile');
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

// Admin API
app.use('/api/admin', adminRoutes)

// Categories API
app.use('/api/categories', categoryRoutes)

app.use('/api/profile', profileRoutes)

// Products API
app.use('/api/products', productRoutes)

app.use('/api/profile', profileRoutes);
// Cart API
app.use('/api/cart', cartRoutes)

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

// Start server
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`)
  console.log(`Categories endpoint: http://localhost:${PORT}/api/categories`)
  console.log(`Products endpoint: http://localhost:${PORT}/api/products`)
  console.log(`Admin endpoint: http://localhost:${PORT}/api/admin`)
})
