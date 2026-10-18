
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

type Product = {
  id: number
  name: string
  slug?: string
  description?: string | null
  brand?: string | null
  sku?: string | null
  price: number | string
  stock_quantity?: number
  color?: string | null
  material?: string | null
  capacity_liters?: number | null
  weight_kg?: number | null
  image_url?: string | null
  category_name?: string | null
  category_display_name?: string | null
  category_slug?: string | null
}

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')

function getProductImage(imageUrl?: string | null): string {
  if (!imageUrl) return ''

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl
  }

  return `${API_ORIGIN}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const successPanelRef = useRef<HTMLDivElement>(null)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [cartMessage, setCartMessage] = useState('')
  const [cartAdded, setCartAdded] = useState(false)

  // Automatically bring the success panel into view.
  useEffect(() => {
    if (cartAdded) {
      successPanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [cartAdded])

  // Load product details.
  useEffect(() => {
    let cancelled = false

    async function fetchProduct() {
      if (!id) {
        setError('Product ID is missing.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        setProduct(null)
        setCartMessage('')
        setCartAdded(false)
        setQuantity(1)

        const response = await fetch(
          `${API_URL}/products/${encodeURIComponent(id)}`
        )

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'Product not found.'
              : 'Failed to load product.'
          )
        }

        const data = await response.json()
        const fetchedProduct = data.product ?? data

        if (!fetchedProduct || !fetchedProduct.id) {
          throw new Error('Invalid product data received from the server.')
        }

        if (!cancelled) {
          setProduct(fetchedProduct)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Something went wrong while loading the product.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchProduct()

    return () => {
      cancelled = true
    }
  }, [id])

  // Add the selected product quantity to the cart.
  async function addToCart() {
    if (!product || addingToCart) return

    const token = localStorage.getItem('shop_token')
    const userValue = localStorage.getItem('shop_user')

    if (!token || !userValue) {
      navigate('/login')
      return
    }

    let user: { role?: string }

    try {
      user = JSON.parse(userValue)
    } catch {
      setCartAdded(false)
      setCartMessage('Please sign in again to add items to your cart.')
      return
    }

    if (user.role && user.role !== 'customer') {
      setCartAdded(false)
      setCartMessage('Please sign in with a customer account.')
      return
    }

    try {
      setAddingToCart(true)
      setCartMessage('')
      setCartAdded(false)

      const response = await fetch(`${API_URL}/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add product to cart.')
      }

      // Display the success panel only after the API succeeds.
      setCartMessage('')
      setCartAdded(true)
    } catch (err) {
      setCartAdded(false)
      setCartMessage(
        err instanceof Error
          ? err.message
          : 'Unable to add product to cart.'
      )
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-white px-6">
        <p className="text-sm text-stone-500">Loading product...</p>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="min-h-[60vh] bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-semibold text-stone-900">
            Product unavailable
          </h1>

          <p className="mt-3 text-stone-600">
            {error || 'The requested product could not be found.'}
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center bg-green-500 px-6 py-3 text-sm font-bold text-stone-950 transition hover:bg-green-400"
          >
            Back to shopping
          </Link>
        </div>
      </main>
    )
  }

  const price = Number(product.price)
  const stock = Number(product.stock_quantity ?? 0)
  const outOfStock = stock <= 0

  return (
    <main className="min-h-screen bg-white text-stone-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb navigation */}
        <nav className="mb-8 text-sm text-stone-500">
          <Link to="/" className="transition hover:text-green-700">
            Home
          </Link>

          <span className="mx-2">/</span>

          {product.category_slug ? (
            <Link
              to={`/category/${product.category_slug}`}
              className="transition hover:text-green-700"
            >
              {product.category_display_name ||
                product.category_name ||
                'Products'}
            </Link>
          ) : (
            <span>
              {product.category_display_name ||
                product.category_name ||
                'Products'}
            </span>
          )}

          <span className="mx-2">/</span>
          <span className="text-stone-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
          {/* Product image */}
          <div className="overflow-hidden bg-stone-50">
            {product.image_url ? (
              <img
                src={getProductImage(product.image_url)}
                alt={product.name}
                className="aspect-[4/5] w-full object-contain p-4 sm:p-8"
                onError={(event) => {
                  console.error(
                    'Product image failed to load:',
                    event.currentTarget.src
                  )
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-stone-400">
                No image available
              </div>
            )}
          </div>

          {/* Product information */}
          <section className="flex flex-col py-2">
            {product.brand && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                {product.brand}
              </p>
            )}

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-5 text-2xl font-semibold text-stone-950">
              {Number.isFinite(price)
                ? new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  }).format(price)
                : 'Price unavailable'}
            </p>

            {product.description && (
              <div className="mt-6 border-t border-stone-200 pt-6">
                <h2 className="text-sm font-bold text-stone-950">
                  Description
                </h2>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-600">
                  {product.description}
                </p>
              </div>
            )}

            {/* Product specifications */}
            <div className="mt-6 border-t border-stone-200 pt-6">
              <h2 className="text-sm font-bold text-stone-950">
                Product details
              </h2>

              <dl className="mt-4 space-y-3 text-sm">
                {product.sku && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone-500">SKU</dt>
                    <dd className="text-right text-stone-900">
                      {product.sku}
                    </dd>
                  </div>
                )}

                {product.color && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone-500">Color</dt>
                    <dd className="text-right text-stone-900">
                      {product.color}
                    </dd>
                  </div>
                )}

                {product.material && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone-500">Material</dt>
                    <dd className="text-right text-stone-900">
                      {product.material}
                    </dd>
                  </div>
                )}

                {product.capacity_liters != null && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone-500">Capacity</dt>
                    <dd className="text-right text-stone-900">
                      {product.capacity_liters} L
                    </dd>
                  </div>
                )}

                {product.weight_kg != null && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone-500">Weight</dt>
                    <dd className="text-right text-stone-900">
                      {product.weight_kg} kg
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Stock status */}
            <div className="mt-6">
              {outOfStock ? (
                <p className="text-sm font-semibold text-red-600">
                  Out of stock
                </p>
              ) : (
                <p className="text-sm font-medium text-green-700">
                  In stock
                  {stock <= 5 ? ` — only ${stock} left` : ''}
                </p>
              )}
            </div>

            {/* Quantity selector */}
            <div className="mt-6">
              <label
                htmlFor="quantity"
                className="mb-2 block text-sm font-semibold text-stone-900"
              >
                Quantity
              </label>

              <div className="flex w-fit items-center border border-stone-300">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                  disabled={quantity <= 1}
                  className="px-4 py-2 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={stock > 0 ? stock : undefined}
                  value={quantity}
                  onChange={(event) => {
                    const value = Number(event.target.value)

                    if (Number.isInteger(value) && value >= 1) {
                      setQuantity(
                        stock > 0 ? Math.min(value, stock) : value
                      )
                    }
                  }}
                  className="w-16 border-x border-stone-300 py-2 text-center text-sm outline-none focus:border-green-600"
                />

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      stock > 0
                        ? Math.min(current + 1, stock)
                        : current + 1
                    )
                  }
                  disabled={outOfStock || quantity >= stock}
                  className="px-4 py-2 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart button */}
            <button
              type="button"
              onClick={addToCart}
              disabled={
                addingToCart ||
                outOfStock ||
                !Number.isFinite(price) ||
                price < 0
              }
              className="mt-6 w-full bg-green-500 px-6 py-4 text-sm font-bold text-stone-950 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              {addingToCart
                ? 'Adding to cart...'
                : outOfStock
                  ? 'Out of stock'
                  : 'Add to cart'}
            </button>

            {/* Success panel */}
            {cartAdded && (
              <div
                ref={successPanelRef}
                role="status"
                aria-live="polite"
                className="mt-5 border border-green-200 bg-green-50 p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-green-500 text-lg font-bold text-stone-950">
                    ✓
                  </span>

                  <div>
                    <h2 className="font-bold text-stone-950">
                      Added to your cart!
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-stone-600">
                      {quantity}{' '}
                      {quantity === 1 ? 'item has' : 'items have'} been added
                      successfully. What would you like to do next?
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => navigate('/cart')}
                    className="w-full bg-green-500 px-4 py-3.5 text-sm font-bold text-stone-950 transition hover:bg-green-400"
                  >
                    Go to cart →
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="w-full border border-stone-300 bg-white px-4 py-3.5 text-sm font-bold text-stone-800 transition hover:border-stone-950 hover:bg-stone-950 hover:text-white"
                  >
                    Back to shopping
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {!cartAdded && cartMessage && (
              <p
                role="alert"
                className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {cartMessage}
              </p>
            )}

            <p className="mt-4 text-center text-xs leading-6 text-stone-500">
              Thoughtfully designed bags for everyday life and travel.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
