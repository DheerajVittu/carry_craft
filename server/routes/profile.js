
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

    const customerId =
      decoded.customerId ?? decoded.userId ?? decoded.id;

    if (!customerId || !Number.isInteger(Number(customerId))) {
      return res.status(401).json({ message: 'Invalid customer token.' });
    }

    req.customerId = Number(customerId);
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }
}

// Get the customer's primary address.
// If there is no default address, use the most recently updated one.
async function getCustomerAddress(db, customerId) {
  const result = await db.query(
    `SELECT
       id,
       customer_id,
       address_type,
       full_name,
       phone_number,
       address_line1,
       address_line2,
       city,
       state,
       postal_code,
       country,
       is_default,
       created_at,
       updated_at
     FROM customer_addresses
     WHERE customer_id = $1
     ORDER BY
       is_default DESC NULLS LAST,
       updated_at DESC NULLS LAST,
       created_at DESC
     LIMIT 1`,
    [customerId]
  );

  return result.rows[0] || null;
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

    const address = await getCustomerAddress(pool, req.customerId);

    res.json({
      customer: result.rows[0],
      address,
    });
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

  const inputAddress = req.body.address || {};

  const addressFields = [
    'address_line1',
    'address_line2',
    'city',
    'state',
    'postal_code',
    'country',
  ];

  const address = {};

  for (const field of addressFields) {
    address[field] =
      typeof inputAddress[field] === 'string'
        ? inputAddress[field].trim()
        : '';
  }

  if (!fullName) {
    return res.status(400).json({ message: 'Full name is required.' });
  }

  if (
    address.address_line1.length > 255 ||
    address.address_line2.length > 255 ||
    address.city.length > 120 ||
    address.state.length > 120 ||
    address.postal_code.length > 20 ||
    address.country.length > 100 ||
    fullName.length > 150 ||
    phoneNumber.length > 30
  ) {
    return res.status(400).json({
      message: 'One or more fields exceed the allowed length.',
    });
  }

  // An address is considered started when at least one field is filled.
  const hasAddressInput = addressFields.some(
    (field) => address[field] !== ''
  );

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const customerResult = await client.query(
      `UPDATE customers
       SET full_name = $1, phone_number = $2
       WHERE id = $3
       RETURNING id, full_name, email, phone_number`,
      [fullName, phoneNumber || null, req.customerId]
    );

    if (customerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const existingAddress = await getCustomerAddress(
      client,
      req.customerId
    );

    let savedAddress = existingAddress;

    if (existingAddress) {
      // Update the selected address. Empty values allow customers
      // to clear optional fields or remove their saved address details.
      const addressResult = await client.query(
        `UPDATE customer_addresses
         SET full_name = $1,
             phone_number = $2,
             address_line1 = $3,
             address_line2 = $4,
             city = $5,
             state = $6,
             postal_code = $7,
             country = $8,
             updated_at = NOW()
         WHERE id = $9 AND customer_id = $10
         RETURNING *`,
        [
          fullName,
          phoneNumber || null,
          address.address_line1 || null,
          address.address_line2 || null,
          address.city || null,
          address.state || null,
          address.postal_code || null,
          address.country || null,
          existingAddress.id,
          req.customerId,
        ]
      );

      savedAddress = addressResult.rows[0] || null;
    } else if (hasAddressInput) {
      // Create the first address only when the customer has entered one.
      const addressResult = await client.query(
        `INSERT INTO customer_addresses (
           customer_id,
           address_type,
           full_name,
           phone_number,
           address_line1,
           address_line2,
           city,
           state,
           postal_code,
           country,
           is_default,
           created_at,
           updated_at
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NOW(), NOW()
         )
         RETURNING *`,
        [
          req.customerId,
          'home',
          fullName,
          phoneNumber || null,
          address.address_line1 || null,
          address.address_line2 || null,
          address.city || null,
          address.state || null,
          address.postal_code || null,
          address.country || null,
        ]
      );

      savedAddress = addressResult.rows[0] || null;
    }

    await client.query('COMMIT');

    res.json({
      message: 'Profile updated successfully.',
      customer: customerResult.rows[0],
      address: savedAddress,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Could not update profile.' });
  } finally {
    client.release();
  }
});

module.exports = router;
