const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

function requireCustomer(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please log in.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Match this property to the customer ID used by your login route.
    const customerId =
      decoded.customerId ?? decoded.userId ?? decoded.id;

    if (!customerId || !Number.isInteger(Number(customerId))) {
      return res.status(401).json({ message: 'Invalid customer token.' });
    }

    req.customerId = Number(customerId);
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token.'
    });
  }
}

// GET /api/profile
router.get('/', requireCustomer, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, phone_number
FROM customers
WHERE id = $1`,
      [req.customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    res.json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Could not load profile.' });
  }
});

// PUT /api/profile
router.put('/', requireCustomer, async (req, res) => {
  const fullName =
    typeof req.body.full_name === 'string'
      ? req.body.full_name.trim()
      : '';

  const phoneNumber =
    typeof req.body.phone_number === 'string'
      ? req.body.phone_number.trim()
      : '';

  if (!fullName) {
    return res.status(400).json({ message: 'Full name is required.' });
  }

  try {
    const result = await pool.query(
      `UPDATE customers
SET full_name = $1, phone_number = $2
WHERE id = $3
RETURNING id, full_name, email, phone_number`,
      [fullName, phoneNumber || null, req.customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    res.json({
      message: 'Profile updated successfully.',
      customer: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Could not update profile.' });
  }
});

module.exports = router;
