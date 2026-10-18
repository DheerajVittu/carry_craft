
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

type Product = {
  id: number
  name: string
  description?: string
  brand?: string
  price: number | string
  color?: string
  material?: string
  stock_quantity: number
  image_url: string
}

type ProductsResponse = {
  category: string
  count: number
  products: Product[]
}

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')

function getProductImage(imageUrl?: string) {
  if (!imageUrl) return ''

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl
  }

  return `${API_ORIGIN}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
}

// function formatPrice(price: number | string) {
//   return new Intl.NumberFormat('de-DE', {
//     style: 'currency',
//     currency: 'EUR',
//   }).format(Number(price))
// }

// function ProductSkeleton() {
//   return (
//     <div className="animate-pulse">
//       <div className="aspect-[4/5] rounded-2xl bg-stone-200" />
//       <div className="mt-4 h-3 w-1/3 rounded bg-stone-200" />
//       <div className="mt-3 h-4 w-4/5 rounded bg-stone-200" />
//       <div className="mt-4 h-4 w-1/4 rounded bg-stone-200" />
//     </div>
//   )
// }

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey] = useState(0)

  const categoryTitle = (slug ?? '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  useEffect(() => {
    if (!slug) {
      setProducts([])
      setLoading(false)
      setError('Category not found.')
      return
    }

    const controller = new AbortController()

    async function fetchProducts() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `${API_URL}/categories/${encodeURIComponent(slug!)}/products`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(
            `Could not load products (${response.status}). Please try again.`,
          )
        }

        const data: ProductsResponse = await response.json()

        if (!Array.isArray(data.products)) {
          throw new Error('Invalid products response from the server.')
        }

        setProducts(data.products)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading products.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void fetchProducts()

    return () => controller.abort()
  }, [slug, retryKey])

  
return (
  <main className="min-h-screen bg-white text-stone-900">
    {/* Simple header */}
    <header className="border-b border-stone-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link
          to="/"
          className="font-serif text-2xl font-bold italic tracking-tight"
        >
          CarryCraft<span className="text-green-600">.</span>
        </Link>

        <Link
          to="/"
          className="text-sm font-medium text-stone-600 transition hover:text-green-700"
        >
          ← Back to home
        </Link>
      </div>
    </header>

    {/* Simple category heading */}
    <section className="bg-stone-50">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
          CarryCraft collection
        </p>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              {categoryTitle}
            </h1>
            <p className="mt-2 text-sm text-stone-500 sm:text-base">
              Find the perfect bag for your everyday journey.
            </p>
          </div>

          {!loading && !error && (
            <p className="text-sm text-stone-500">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
          )}
        </div>
      </div>
    </section>

    {/* Product collection */}
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      {loading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-7">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-[4/5] rounded-xl bg-stone-100" />
              <div className="mt-4 h-3 w-1/3 rounded bg-stone-100" />
              <div className="mt-3 h-4 w-4/5 rounded bg-stone-100" />
              <div className="mt-3 h-4 w-1/4 rounded bg-stone-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-green-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-900"
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <h2 className="font-serif text-2xl font-bold">
            No products available yet
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            There are currently no active products in this category.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block rounded-lg bg-green-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-900"
          >
            Browse other categories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-7">
          {products.map((product) => {
            const imageSrc = getProductImage(product.image_url)

            return (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="group min-w-0"
              >
                {/* Product image */}
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105 sm:p-5"
                      onError={(event) => {
                        console.error(
                          `Failed to load image for "${product.name}":`,
                          event.currentTarget.src,
                        )
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-stone-400">
                      No image available
                    </div>
                  )}

                  <span
                    className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[10px] font-semibold sm:left-3 sm:top-3 sm:text-xs ${
                      product.stock_quantity > 0
                        ? 'bg-white text-green-800'
                        : 'bg-stone-800 text-white'
                    }`}
                  >
                    {product.stock_quantity > 0 ? 'In stock' : 'Out of stock'}
                  </span>
                </div>

                {/* Product details */}
                <div className="pt-4">
                  {product.brand && (
                    <p className="truncate text-[10px] font-medium uppercase tracking-widest text-stone-500 sm:text-xs">
                      {product.brand}
                    </p>
                  )}

                  <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-6 transition-colors group-hover:text-green-800 sm:text-base">
                    {product.name}
                  </h2>

                  {product.color && (
                    <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                      {product.color}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold sm:text-base">
                      {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR',
                      }).format(Number(product.price))}
                    </p>

                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition group-hover:border-green-800 group-hover:bg-green-800 group-hover:text-white">
                      <span aria-hidden="true">↗</span>
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>

    {/* Minimal footer */}
    <footer className="mt-8 border-t border-stone-200">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="font-serif font-bold italic text-stone-800">
          CarryCraft<span className="text-green-600">.</span>
        </span>
        <span>Made for your next journey.</span>
      </div>
    </footer>
  </main>
)

}
