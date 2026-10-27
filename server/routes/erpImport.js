
const express = require('express')
const multer = require('multer')
const XLSX = require('xlsx')
const pool = require('../db')
const requireAdmin = require('../middleware/requireAdmin')

const router = express.Router()

// Protect the entire ERP import route.
router.use(requireAdmin)

// Accept one Excel file in memory, up to 5 MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const extension = require('path')
      .extname(file.originalname)
      .toLowerCase()

    if (!['.xlsx', '.xls'].includes(extension)) {
      return cb(new Error('Please upload an Excel file (.xlsx or .xls).'))
    }

    cb(null, true)
  },
})

function cleanText(value) {
  if (value === undefined || value === null) return ''
  return String(value).trim()
}

function makeSlug(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// POST /api/admin/erp-import
// Upload an Excel export from the Mini ERP.
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'Please select an Excel file to import.',
    })
  }

  let client

  try {
    const workbook = XLSX.read(req.file.buffer, {
      type: 'buffer',
    })

    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
      return res.status(400).json({
        message: 'The Excel file contains no worksheets.',
      })
    }

    const worksheet = workbook.Sheets[firstSheetName]

    const rawRows = XLSX.utils.sheet_to_json(worksheet, {
      defval: null,
    })

    if (rawRows.length === 0) {
      return res.status(400).json({
        message: 'The Excel worksheet contains no product rows.',
      })
    }

    // Normalize column names so extra spaces and capitalization
    // do not prevent the importer from recognizing them.
    const rows = rawRows.map((row) => {
      const normalized = {}

      for (const [key, value] of Object.entries(row)) {
        normalized[String(key).trim().toLowerCase()] = value
      }

      return {
        erpId: cleanText(normalized['product id']),
        name: cleanText(normalized['product name']),
        description: cleanText(normalized['description']),
        price: normalized['price'],
        stock: normalized['stock'],
      }
    })

    const requiredColumns = [
      'product id',
      'product name',
      'price',
      'stock',
    ]

    const actualColumns = Object.keys(rawRows[0]).map((key) =>
      String(key).trim().toLowerCase()
    )

    const missingColumns = requiredColumns.filter(
      (column) => !actualColumns.includes(column)
    )

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: 'The Excel file is missing required columns.',
        missingColumns,
      })
    }

    // Validate every row before changing the database.
    const seenIds = new Set()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 2

      if (!row.erpId || !row.name) {
        return res.status(400).json({
          message: `Row ${rowNumber}: Product ID and Product Name are required.`,
        })
      }

      if (seenIds.has(row.erpId)) {
        return res.status(400).json({
          message: `Row ${rowNumber}: Duplicate ERP Product ID "${row.erpId}".`,
        })
      }

      seenIds.add(row.erpId)

      if (
        row.price === null ||
        row.price === '' ||
        !Number.isFinite(Number(row.price)) ||
        Number(row.price) < 0
      ) {
        return res.status(400).json({
          message: `Row ${rowNumber}: Price must be a non-negative number.`,
        })
      }

      if (
        row.stock === null ||
        row.stock === '' ||
        !Number.isInteger(Number(row.stock)) ||
        Number(row.stock) < 0
      ) {
        return res.status(400).json({
          message: `Row ${rowNumber}: Stock must be a non-negative integer.`,
        })
      }
    }

    client = await pool.connect()

    await client.query('BEGIN')

    let inserted = 0
    let updated = 0

    for (const row of rows) {
      const erpId = row.erpId
      const name = row.name
      const description = row.description || null
      const price = Number(row.price)
      const stock = Number(row.stock)

      const existing = await client.query(
        `SELECT id, slug
         FROM products
         WHERE erp_product_id = $1
         FOR UPDATE`,
        [erpId]
      )

      if (existing.rows.length > 0) {
        // Update only ERP-managed fields.
        await client.query(
          `UPDATE products
           SET name = $1,
               description = $2,
               price = $3,
               stock_quantity = $4,
               updated_at = NOW()
           WHERE erp_product_id = $5`,
          [name, description, price, stock, erpId]
        )

        updated++
        continue
      }

      // Keep the ERP ID separate from CarryCraft's internal ID and SKU.
      const baseSlug = `erp-${makeSlug(erpId) || 'product'}`
      let slug = baseSlug

      // Avoid collisions with existing CarryCraft product slugs.
      const slugCheck = await client.query(
        'SELECT 1 FROM products WHERE slug = $1',
        [slug]
      )

      if (slugCheck.rows.length > 0) {
        slug = `${baseSlug}-${Date.now()}-${inserted}`
      }

      await client.query(
        `INSERT INTO products (
           erp_product_id,
           category_id,
           name,
           slug,
           description,
           sku,
           price,
           stock_quantity,
           image_url,
           is_active
         )
         VALUES ($1, NULL, $2, $3, $4, NULL, $5, $6, NULL, TRUE)`,
        [erpId, name, slug, description, price, stock]
      )

      inserted++
    }

    await client.query('COMMIT')

    res.json({
      message: 'ERP product import completed successfully.',
      file: req.file.originalname,
      totalRows: rows.length,
      inserted,
      updated,
    })
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('ERP import rollback failed:', rollbackError.message)
      }
    }

    console.error('ERP import error:', error.message)

    res.status(400).json({
      message: 'ERP import failed. No partial database changes were committed.',
      error: error.message,
    })
  } finally {
    if (client) client.release()
  }
})

// Return JSON errors for upload failures.
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error)

  res.status(400).json({
    message: error.message || 'File upload failed.',
  })
})

module.exports = router
