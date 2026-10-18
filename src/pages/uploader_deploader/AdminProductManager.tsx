import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const SERVER_URL = API_URL.replace(/\/api\/?$/, '')

interface Product {
  id: number
  name: string
  brand: string | null
  price: number | string
  stock_quantity: number
  category_id?: number
  category_display_name: string | null
  image_url: string | null
  is_active: boolean
  sku?: string | null

  // Add these fields
  description?: string | null
  color?: string | null
  material?: string | null
  capacity_liters?: number | string | null
  weight_kg?: number | string | null
}

interface Category {
  id: number
  name: string
}

interface Props {
  products: Product[]
  onChanged: () => void
}

interface ProductForm {
  name: string
  category_id: string
  slug: string
  description: string
  brand: string
  sku: string
  price: string
  stock_quantity: string
  color: string
  material: string
  capacity_liters: string
  weight_kg: string
}
const emptyForm: ProductForm = {
  name: '',
  category_id: '',
  slug: '',
  description: '',
  brand: '',
  sku: '',
  price: '',
  stock_quantity: '0',
  color: '',
  material: '',
  capacity_liters: '',
  weight_kg: '',
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return ''

  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('blob:')
  ) {
    return imageUrl
  }

  return `${SERVER_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
}

export function AdminProductManager({
  products,
  onChanged,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function getToken(): string | null {
    return localStorage.getItem('shop_token')
  }

  async function request(
    path: string,
    options: RequestInit = {},
  ): Promise<any> {
    const currentToken = getToken()

    if (!currentToken) {
      throw new Error(
        'Please log in as an administrator again.',
      )
    }

    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${currentToken}`)

    // Do not manually set Content-Type for FormData.
    // The browser must add the multipart boundary itself.
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Request failed (${response.status}).`,
      )
    }

    return data
  }

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      setCategoriesLoading(true)

      try {
        const data = await request('/categories')

        const list: Category[] = Array.isArray(data)
          ? data
          : Array.isArray(data.categories)
            ? data.categories
            : []

        if (!cancelled) {
          setCategories(list)
          if (list.length === 0) {
            setError(
              'No categories found. Add categories in your database first.',
            )
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load categories.',
          )
        }
      } finally {
        if (!cancelled) setCategoriesLoading(false)
      }
    }

    void loadCategories()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!image) return

    const objectUrl = URL.createObjectURL(image)
    setPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [image])

  function updateField(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'name'
        ? { slug: generateSlug(value) }
        : {}),
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setImage(null)
    setPreview('')
    setEditingId(null)
    setShowForm(false)
  }

  function startAdd() {
    setError('')
    setMessage('')
    setForm(emptyForm)
    setImage(null)
    setPreview('')
    setEditingId(null)
    setShowForm(true)
  }

  
function startEdit(product: Product) {
  setError('')
  setMessage('')

  setEditingId(product.id)

  setForm({
    ...emptyForm,
    name: product.name || '',
    brand: product.brand || '',
    price: String(product.price ?? ''),
    stock_quantity: String(product.stock_quantity ?? 0),
    category_id: String(product.category_id ?? ''),
    sku: product.sku || '',
    slug: generateSlug(product.name || ''),

    // Populate the additional fields when editing
    description: product.description ?? '',
    color: product.color ?? '',
    material: product.material ?? '',
    capacity_liters:
      product.capacity_liters == null
        ? ''
        : String(product.capacity_liters),
    weight_kg:
      product.weight_kg == null
        ? ''
        : String(product.weight_kg),
  })

  setImage(null)
  setPreview(getImageUrl(product.image_url))
  setShowForm(true)
}


  async function saveProduct(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (!form.name.trim()) {
        throw new Error('Please enter a product name.')
      }

      if (
  !form.category_id ||
  !Number.isInteger(Number(form.category_id)) ||
  Number(form.category_id) < 1
) {
  throw new Error('Please select a valid category.')
}

      if (!editingId && !image) {
        throw new Error('Please select a product image.')
      }

      if (!editingId && !form.slug) {
        throw new Error('Could not generate a slug from the product name.')
      }

      const price = Number(form.price)
      const stock = Number(form.stock_quantity)

      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Enter a valid non-negative price.')
      }

      if (
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        throw new Error('Stock quantity must be a non-negative whole number.')
      }

      const body = new FormData()

// Send the category ID first, before the image file.
body.append('category_id', String(form.category_id))

// Append all remaining fields without duplicating category_id.
Object.entries(form).forEach(([key, value]) => {
  if (key !== 'category_id') {
    body.append(
      key,
      key === 'slug' ? generateSlug(form.name) : value
    )
  }
})

// Append the image last.
if (image) {
  body.append('image', image)
}

      const endpoint = editingId
        ? `/admin/products/${editingId}`
        : '/admin/products'

      await request(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        body,
      })

      setMessage(
        editingId
          ? 'Product updated successfully.'
          : 'Product added successfully.',
      )

      resetForm()
      onChanged()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save product.',
      )
    } finally {
      setLoading(false)
    }
  }




  async function deactivateProduct(id: number) {
    const confirmed = window.confirm(
        'Are you sure you want to deactivate this bag?'
    );

    if (!confirmed) return;

    setError('');
    setMessage('');

    try {
      await request(`/admin/products/${id}/deactivate`, {
        method: 'PATCH',
      });

      setMessage(`Product ${id} deactivated successfully.`);

      // Use the callback supplied by the parent component.
      onChanged();
    } catch (err) {
      const errorMessage =
          err instanceof Error
              ? err.message
              : 'Could not deactivate product.';

      setError(errorMessage);
      console.error('Deactivate product error:', err);
    }
  }

  
async function activateProduct(id: number) {
  const confirmed = window.confirm(
    'Are you sure you want to activate this bag?'
  )

  if (!confirmed) return

  setError('')
  setMessage('')

  try {
    await request(`/admin/products/${id}/activate`, {
      method: 'PATCH',
    })

    setMessage(`Product ${id} activated successfully.`)

    // Refresh the dashboard and product list.
    onChanged()
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : 'Could not activate product.'

    setError(errorMessage)
    console.error('Activate product error:', err)
  }
}





  const activeProducts = products.filter(
    (product) => product.is_active,
  )

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="font-bold"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Manage Bags
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add new bags, update product details, or deactivate products.
          </p>
        </div>

        <button
          type="button"
          onClick={startAdd}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          + Add New Bag
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Bag' : 'Add New Bag'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Fields marked with * are required.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={saveProduct} className="space-y-6 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Product name */}
              <div>
                <label
                  htmlFor="product-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Product Name *
                </label>
                <input
                  id="product-name"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="e.g. Travel Backpack"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Category — important */}
              <div>
                <label
                  htmlFor="product-category"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Category *
                </label>

                <select
  id="product-category"
  name="category_id"
  value={form.category_id}
  onChange={updateField}
  required
  disabled={categoriesLoading || categories.length === 0}
  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
>
  <option value="">
    {categoriesLoading
      ? 'Loading categories...'
      : categories.length === 0
        ? 'No categories available'
        : 'Select a category'}
  </option>

  {categories.map((category) => (
    <option key={category.id} value={category.id}>
      {category.name}
    </option>
  ))}
</select>
              </div>

              {/* Brand */}
              <div>
                <label
                  htmlFor="product-brand"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Brand
                </label>
                <input
                  id="product-brand"
                  name="brand"
                  value={form.brand}
                  onChange={updateField}
                  placeholder="e.g. CarryCraft"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* SKU */}
              <div>
                <label
                  htmlFor="product-sku"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  SKU
                </label>
                <input
                  id="product-sku"
                  name="sku"
                  value={form.sku}
                  onChange={updateField}
                  placeholder="e.g. CC-BAG-001"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Price */}
              <div>
                <label
                  htmlFor="product-price"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Price (€) *
                </label>
                <input
                  id="product-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={updateField}
                  placeholder="49.99"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Stock */}
              <div>
                <label
                  htmlFor="product-stock"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Stock Quantity *
                </label>
                <input
                  id="product-stock"
                  name="stock_quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock_quantity}
                  onChange={updateField}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Color */}
              <div>
                <label
                  htmlFor="product-color"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Color
                </label>
                <input
                  id="product-color"
                  name="color"
                  value={form.color}
                  onChange={updateField}
                  placeholder="e.g. Black"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Material */}
              <div>
                <label
                  htmlFor="product-material"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Material
                </label>
                <input
                  id="product-material"
                  name="material"
                  value={form.material}
                  onChange={updateField}
                  placeholder="e.g. Polyester"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Capacity */}
              <div>
                <label
                  htmlFor="product-capacity"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Capacity (liters)
                </label>
                <input
                  id="product-capacity"
                  name="capacity_liters"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.capacity_liters}
                  onChange={updateField}
                  placeholder="25"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Weight */}
              <div>
                <label
                  htmlFor="product-weight"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Weight (kg)
                </label>
                <input
                  id="product-weight"
                  name="weight_kg"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.weight_kg}
                  onChange={updateField}
                  placeholder="0.75"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {/* Slug intentionally hidden; generated from name */}
              <input
                type="hidden"
                name="slug"
                value={form.slug}
                readOnly
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="product-description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>
              <textarea
                id="product-description"
                name="description"
                value={form.description}
                onChange={updateField}
                rows={4}
                placeholder="Describe the bag, its features, and intended use..."
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* Image upload */}
            <div>
              <label
                htmlFor="product-image"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Product Image {!editingId && '*'}
              </label>

              <div className="rounded-xl border-2 border-dashed border-slate-300 p-5 transition hover:border-slate-500">
                <input
                  id="product-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null

                    setError('')
                    setImage(file)

                    if (file) {
                      if (!file.type.startsWith('image/')) {
                        setImage(null)
                        setError('Please select a valid image file.')
                        event.target.value = ''
                        return
                      }

                      if (file.size > 5 * 1024 * 1024) {
                        setImage(null)
                        setError('Image size must be 5 MB or less.')
                        event.target.value = ''
                      }
                    }
                  }}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-slate-700"
                />

                <p className="mt-2 text-xs text-slate-500">
                  PNG, JPG, WEBP, or GIF. Maximum size: 5 MB.
                </p>

                {preview && (
                  <div className="mt-5">
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Image preview
                    </p>
                    <img
                      src={preview}
                      alt="Product preview"
                      className="h-48 w-48 rounded-xl border border-slate-200 bg-slate-50 object-contain"
                    />
                    {editingId && !image && (
                      <p className="mt-2 text-xs text-slate-500">
                        Current image will be kept unless you choose a replacement.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || categoriesLoading || categories.length === 0}
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Saving...'
                  : editingId
                    ? 'Update Bag'
                    : 'Save Bag'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Products list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h3 className="font-bold text-slate-900">
            Existing Products
          </h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {activeProducts.length} active
          </span>
        </div>

        {products.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-semibold text-slate-700">
              No products found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Use “Add New Bag” to create your first product.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Product</th>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Price</th>
                  <th className="px-5 py-4 font-semibold">Stock</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={getImageUrl(product.image_url)}
                            alt={product.name}
                            className="h-14 w-14 rounded-lg border border-slate-200 bg-white object-contain"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                            No image
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-slate-900">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {product.brand || 'No brand'}
                          </p>
                          <p className="text-xs text-slate-400">
                            ID: {product.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {product.category_display_name || 'Uncategorized'}
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-900">
                      €{Number(product.price).toFixed(2)}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {product.stock_quantity}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
    product.is_active
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-100 text-slate-500'
}`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Edit
                        </button>

                        
{product.is_active ? (
  <button
    type="button"
    onClick={() => void deactivateProduct(product.id)}
    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
  >
    Deactivate
  </button>
) : (
  <button
    type="button"
    onClick={() => void activateProduct(product.id)}
    className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50"
  >
    Activate
  </button>
)}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
