
const express = require('express')
const multer = require('multer')
const XLSX = require('xlsx')
const path = require('path')
const pool = require('../db')
const requireAdmin = require('../middleware/requireAdmin')

const router = express.Router()

router.use(requireAdmin)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()

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

function nullableText(value) {
  const text = cleanText(value)
  return text === '' ? null : text
}

function makeSlug(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeHeader(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value

  const normalized = cleanText(value).toLowerCase()

  if (['true', 'yes', '1', 'active'].includes(normalized)) return true
  if (['false', 'no', '0', 'inactive'].includes(normalized)) return false

  return null
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || cleanText(value) === '') {
    return null
  }

  const number = Number(value)
  return Number.isFinite(number) ? number : NaN
}

function getValue(row, ...aliases) {
  for (const alias of aliases) {
    const key = normalizeHeader(alias)

    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key]
    }
  }

  return undefined
}

// POST /api/admin/erp-import
// Import an Excel export from the Mini-ERP.
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'Please select an Excel file to import.',
    })
  }

  let client

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
      return res.status(400).json({
        message: 'The Excel file contains no worksheets.',
      })
    }

    const worksheet = workbook.Sheets[firstSheetName]
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: null })

    if (rawRows.length === 0) {
      return res.status(400).json({
        message: 'The Excel worksheet contains no product rows.',
      })
    }

    const actualColumns = Object.keys(rawRows[0]).map(normalizeHeader)
    const columnSet = new Set(actualColumns)

    const requiredColumns = [
      'product id',
      'product name',
      'price',
      'stock',
    ]

    const missingColumns = requiredColumns.filter(
      (column) => !columnSet.has(column)
    )

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: 'The Excel file is missing required columns.',
        missingColumns,
      })
    }

    // Normalize ERP export headings while retaining which optional
    // columns are present in this particular file.
    const rows = rawRows.map((raw) => {
      const row = {}

      for (const [key, value] of Object.entries(raw)) {
        row[normalizeHeader(key)] = value
      }

      const get = (...aliases) => getValue(row, ...aliases)

      return {
        erpId: cleanText(get('Product ID')),
        name: cleanText(get('Product Name')),
        description: nullableText(get('Description')),
        brand: nullableText(get('Brand')),
        sku: nullableText(get('SKU')),
        slug: nullableText(get('Slug')),
        price: get('Price'),
        currency: nullableText(get('Currency')),
        stock: get('Stock'),
        category: nullableText(get('Category')),
        color: nullableText(get('Color')),
        material: nullableText(get('Material')),
        capacityLiters: parseOptionalNumber(
          get('Capacity (Liters)', 'Capacity Liters', 'Capacity')
        ),
        weightKg: parseOptionalNumber(
          get('Weight (kg)', 'Weight Kg', 'Weight')
        ),
        imageUrl: nullableText(get('Image URL', 'Image Url')),
        isActive: parseBoolean(get('Active', 'Is Active')),
      }
    })

    // Validate all rows before starting database changes.
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
        cleanText(row.price) === '' ||
        !Number.isFinite(Number(row.price)) ||
        Number(row.price) < 0
      ) {
        return res.status(400).json({
          message: `Row ${rowNumber}: Price must be a non-negative number.`,
        })
      }

      if (
        row.stock === null ||
        cleanText(row.stock) === '' ||
        !Number.isInteger(Number(row.stock)) ||
        Number(row.stock) < 0
      ) {
        return res.status(400).json({
          message: `Row ${rowNumber}: Stock must be a non-negative integer.`,
        })
      }

      if (
        Number.isNaN(row.capacityLiters) ||
        (row.capacityLiters !== null && row.capacityLiters < 0)
      ) {
        return res.status(400).json({
          message: `Row ${rowNumber}: Capacity must be a non-negative number.`,
        })
      }

      if (
        Number.isNaN(row.weightKg) ||
        (row.weightKg !== null && row.weightKg < 0)
      ) {
        return res.status(400).json({
          message: `Row ${rowNumber}: Weight must be a non-negative number.`,
        })
      }

      if (
        columnSet.has('active') &&
        row.isActive === null
      ) {
        return res.status(400).json({
          message: `Row ${rowNumber}: Active must be true/false, yes/no, or 1/0.`,
        })
      }
    }

    client = await pool.connect()
    await client.query('BEGIN')

    // Map existing category names to their IDs. Unknown categories
    // remain NULL rather than being assigned to an unrelated category.
    const categoryResult = await client.query(
      'SELECT id, name FROM categories'
    )

    const categoryMap = new Map(
      categoryResult.rows.map((category) => [
        cleanText(category.name).toLowerCase(),
        category.id,
      ])
    )

    let inserted = 0
    let updated = 0

    for (const row of rows) {
      const price = Number(row.price)
      const stock = Number(row.stock)

      const categoryId = row.category
        ? categoryMap.get(row.category.toLowerCase()) ?? null
        : null

      const existingResult = await client.query(
        `SELECT id, slug
         FROM products
         WHERE erp_product_id = $1
         FOR UPDATE`,
        [row.erpId]
      )

      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0]

        // Only update optional fields whose columns are included
        // in this export. A blank cell clears that field to NULL.
        const updates = [
          ['name', row.name, true],
          ['description', row.description, columnSet.has('description')],
          ['brand', row.brand, columnSet.has('brand')],
          ['sku', row.sku, columnSet.has('sku')],
          ['price', price, true],
          ['stock_quantity', stock, true],
          ['category_id', categoryId, columnSet.has('category')],
          ['color', row.color, columnSet.has('color')],
          ['material', row.material, columnSet.has('material')],
          ['capacity_liters', row.capacityLiters, columnSet.has('capacity liters') || columnSet.has('capacity')],
          ['weight_kg', row.weightKg, columnSet.has('weight kg') || columnSet.has('weight')],
          ['image_url', row.imageUrl, columnSet.has('image url')],
          ['is_active', row.isActive, columnSet.has('active') || columnSet.has('is active')],
        ]

        let newSlug = existing.slug

        if (columnSet.has('slug') && row.slug) {
          newSlug = row.slug
        }

        if (columnSet.has('slug')) {
          const slugCheck = await client.query(
            'SELECT id FROM products WHERE slug = $1 AND id <> $2',
            [newSlug, existing.id]
          )

          if (slugCheck.rows.length > 0) {
            throw new Error(
              `Slug "${newSlug}" is already used by another product.`
            )
          }

          updates.push(['slug', newSlug, true])
        }

        const activeUpdates = updates.filter(([, , shouldUpdate]) => shouldUpdate)
        const assignments = []
        const values = []

        for (const [column, value] of activeUpdates) {
          values.push(value)
          assignments.push(`${column} = $${values.length}`)
        }

        assignments.push('updated_at = NOW()')
        values.push(row.erpId)

        await client.query(
          `UPDATE products
           SET ${assignments.join(', ')}
           WHERE erp_product_id = $${values.length}`,
          values
        )

        updated++
        continue
      }

      const baseSlug = row.slug || `erp-${makeSlug(row.erpId) || 'product'}`
      let slug = baseSlug

      const slugCheck = await client.query(
        'SELECT 1 FROM products WHERE slug = $1',
        [slug]
      )

      if (slugCheck.rows.length > 0) {
        slug = `erp-${makeSlug(row.erpId) || 'product'}`
      }

      const finalSlugCheck = await client.query(
        'SELECT 1 FROM products WHERE slug = $1',
        [slug]
      )

      if (finalSlugCheck.rows.length > 0) {
        slug = `${slug}-${Date.now()}-${inserted}`
      }

      await client.query(
        `INSERT INTO products (
          erp_product_id,
          category_id,
          name,
          slug,
          description,
          brand,
          sku,
          price,
          stock_quantity,
          color,
          material,
          capacity_liters,
          weight_kg,
          image_url,
          is_active
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )`,
        [
          row.erpId,
          categoryId,
          row.name,
          slug,
          row.description,
          row.brand,
          row.sku,
          price,
          stock,
          row.color,
          row.material,
          row.capacityLiters,
          row.weightKg,
          row.imageUrl,
          row.isActive === null ? true : row.isActive,
        ]
      )

      inserted++
    }

    await client.query('COMMIT')

    return res.json({
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

    return res.status(400).json({
      message: 'ERP import failed. No partial database changes were committed.',
      error: error.message,
    })
  } finally {
    if (client) client.release()
  }
})

router.use((error, req, res, next) => {
  if (res.headersSent) return next(error)

  return res.status(400).json({
    message: error.message || 'File upload failed.',
  })
})

module.exports = router
