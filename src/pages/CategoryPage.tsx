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

    // Keep full URLs unchanged.
    if (/^https?:\/\//i.test(imageUrl)) {
        return imageUrl
    }

    // Relative image paths must be loaded from the backend.
    return `${API_ORIGIN}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
}

export default function CategoryPage() {
    const { slug } = useParams<{ slug: string }>()

    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const categoryTitle = (slug ?? '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
                    `${API_URL}/categories/${encodeURIComponent(slug)}/products`,
                    { signal: controller.signal }
                )

                if (!response.ok) {
                    throw new Error(
                        `Could not load products (${response.status}). Please try again.`
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
                        : 'Something went wrong while loading products.'
                )
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        fetchProducts()

        return () => controller.abort()
    }, [slug])

    return (
        <main className="min-h-screen bg-white text-stone-900">
            {/* Header */}
            <header className="border-b border-stone-200">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
                    <Link to="/" className="font-serif text-2xl font-bold italic">
                        CarryCraft<span className="text-green-600">.</span>
                    </Link>

                    <Link
                        to="/"
                        className="text-sm font-medium hover:text-green-700"
                    >
                        ← Back to home
                    </Link>
                </div>
            </header>

            {/* Category heading */}
            <section className="bg-stone-50 px-5 py-12 sm:py-16">
                <div className="mx-auto max-w-7xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                        Explore CarryCraft
                    </p>

                    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                        {categoryTitle}
                    </h1>

                    <p className="mt-3 text-sm text-stone-600">
                        Find the right bag for wherever life takes you.
                    </p>

                    {!loading && !error && (
                        <p className="mt-4 text-sm text-stone-500">
                            {products.length}{' '}
                            {products.length === 1 ? 'product' : 'products'}
                        </p>
                    )}
                </div>
            </section>

            {/* Products */}
            <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
                {loading ? (
                    <p className="py-16 text-center text-stone-500">
                        Loading products...
                    </p>
                ) : error ? (
                    <div className="py-16 text-center">
                        <p className="text-red-600">{error}</p>

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 border border-stone-300 px-5 py-2 text-sm hover:bg-stone-100"
                        >
                            Try again
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="py-16 text-center">
                        <h2 className="text-xl font-semibold">
                            No products found
                        </h2>

                        <p className="mt-2 text-sm text-stone-500">
                            There are currently no active products in this category.
                        </p>

                        <Link
                            to="/"
                            className="mt-6 inline-block bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
                        >
                            Browse categories
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
                        {products.map(product => {
                            const imageSrc = getProductImage(product.image_url)

                            return (
                                <Link
                                    key={product.id}
                                    to={`/product/${product.id}`}
                                    className="group block min-w-0"
                                >
                                    <div className="aspect-[4/5] overflow-hidden bg-stone-100">
                                        {imageSrc ? (
                                            <img
                                                src={imageSrc}
                                                alt={product.name}
                                                loading="lazy"
                                                className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                                                onError={event => {
                                                    console.error(
                                                        `Failed to load image for "${product.name}":`,
                                                        event.currentTarget.src
                                                    )
                                                    event.currentTarget.style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-stone-400">
                                                No image available
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4">
                                        {product.brand && (
                                            <p className="text-xs uppercase tracking-wider text-stone-500">
                                                {product.brand}
                                            </p>
                                        )}

                                        <h2 className="mt-1 font-semibold leading-6">
                                            {product.name}
                                        </h2>

                                        {product.color && (
                                            <p className="mt-1 text-sm text-stone-500">
                                                {product.color}
                                            </p>
                                        )}

                                        <p className="mt-3 font-bold">
                                            {new Intl.NumberFormat('de-DE', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            }).format(Number(product.price))}
                                        </p>

                                        <p
                                            className={`mt-2 text-xs ${
                                                product.stock_quantity > 0
                                                    ? 'text-green-700'
                                                    : 'text-red-600'
                                            }`}
                                        >
                                            {product.stock_quantity > 0
                                                ? 'In stock'
                                                : 'Out of stock'}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </section>
        </main>
    )
}