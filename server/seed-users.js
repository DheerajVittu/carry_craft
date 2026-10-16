
require('dotenv').config()

const bcrypt = require('bcryptjs')
const pool = require('./db')

async function seedUsers() {
  try {
    // Hash both passwords before storing them
    const customerHash = await bcrypt.hash(
      process.env.SEED_CUSTOMER_PASSWORD,
      12
    )

    const adminHash = await bcrypt.hash(
      process.env.SEED_ADMIN_PASSWORD,
      12
    )

    // Create the demo customer
    await pool.query(
      `INSERT INTO customers
        (email, full_name, phone_number, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [
        'customer@gmail.com',
        'Demo Customer',
        '+4915112345678',
        customerHash,
      ]
    )

    // Create the single admin account
    await pool.query(
      `INSERT INTO admins (email, full_name, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      [
        'admin@gmail.com',
        "Shop Administrator",
        adminHash,
      ]
    )

    console.log('Demo accounts seeded successfully.')
    console.log('Customer: customer@gmail.com')
    console.log('Admin: admin@gmail.com')
  } catch (error) {
    console.error('Failed to seed demo accounts:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

if (
  !process.env.SEED_CUSTOMER_PASSWORD ||
  !process.env.SEED_ADMIN_PASSWORD
) {
  console.error('Missing seed passwords in server/.env')
  process.exitCode = 1
  pool.end()
} else {
  seedUsers()
}
