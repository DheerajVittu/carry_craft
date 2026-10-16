
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')

const router = express.Router()

function createToken(user, role) {
  return jwt.sign(
    { id: user.id, email: user.email, role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  )
}

// Customer registration
router.post('/signup', async (req, res) => {
  try {
    const { email, full_name, phone_number, password, confirmPassword } = req.body

    if (!email || !full_name || !phone_number || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please fill in all fields.' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
      `INSERT INTO customers
       (email, full_name, phone_number, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, phone_number`,
      [normalizedEmail, full_name.trim(), phone_number.trim(), passwordHash]
    )

    const customer = result.rows[0]
    const token = createToken(customer, 'customer')

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: { ...customer, role: 'customer' }
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'This email is already registered.' })
    }

    console.error('Signup error:', error.message)
    return res.status(500).json({ message: 'Registration failed.' })
  }
})

// Customer login
router.post('/customer/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const result = await pool.query(
      `SELECT id, email, full_name, phone_number, password_hash
       FROM customers WHERE email = $1`,
      [email.trim().toLowerCase()]
    )

    const customer = result.rows[0]

    if (!customer || !(await bcrypt.compare(password, customer.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = createToken(customer, 'customer')

    return res.json({
      message: 'Customer login successful.',
      token,
      user: {
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
        phone_number: customer.phone_number,
        role: 'customer'
      }
    })
  } catch (error) {
    console.error('Customer login error:', error.message)
    return res.status(500).json({ message: 'Login failed.' })
  }
})

// Admin login — no public admin signup
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const result = await pool.query(
      `SELECT id, email, full_name, password_hash
       FROM admins WHERE email = $1`,
      [email.trim().toLowerCase()]
    )

    const admin = result.rows[0]

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = createToken(admin, 'admin')

    return res.json({
      message: 'Admin login successful.',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: 'admin'
      }
    })
  } catch (error) {
    console.error('Admin login error:', error.message)
    return res.status(500).json({ message: 'Login failed.' })
  }
})


module.exports = router
