const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust this path to your PostgreSQL connection

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, category_name
            FROM categories
            ORDER BY category_name ASC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            message: 'Failed to fetch categories',
        });
    }
});

module.exports = router;