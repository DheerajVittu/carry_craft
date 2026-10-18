
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
// import type { Location } from 'react-router-dom'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')

type OrderItem = {
  id: number
  product_id?: number | null
  product_name: string
  product_sku?: string | null
  image_url?: string | null
  quantity: number
  unit_price: number | string
  line_total: number | string
}

type Order = {
  id: number
  order_number: string
  status: string
  payment_status: string
  subtotal: number | string
  shipping_fee: number | string
  total_amount: number | string
  item_count?: number | string
  created_at: string
  shipping_full_name?: string | null
  shipping_phone?: string | null
  shipping_address_line1?: string | null
  shipping_address_line2?: string | null
  shipping_city?: string | null
  shipping_state?: string | null
  shipping_postal_code?: string | null
  shipping_country?: string | null
  items?: OrderItem[]
}

type OrdersResponse = {
  orders?: Order[]
}

type OrderDetailsResponse = {
  order?: Order
  items?: OrderItem[]
}

type NavigationState = {
  orderNumber?: string
  successMessage?: string
}

function formatPrice(value: number | string | null | undefined) {
  const amount = Number(value ?? 0)

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number.isFinite(amount) ? amount : 0)
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return null

  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('data:')
  ) {
    return imageUrl
  }

  return `${API_ORIGIN}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
}

function getStatusClasses(status?: string) {
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'processing':
      return 'bg-blue-50 text-blue-700'

    case 'shipped':
      return 'bg-purple-50 text-purple-700'

    case 'delivered':
    case 'completed':
      return 'bg-green-50 text-green-700'

    case 'cancelled':
    case 'failed':
      return 'bg-red-50 text-red-700'

    default:
      return 'bg-amber-50 text-amber-700'
  }
}

function formatStatus(status?: string) {
  if (!status) return 'Pending'

  return status
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function PurchaseHistoryPage() {
  const navigate = useNavigate()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)
  const [orderDetails, setOrderDetails] = useState<
    Record<number, Order>
  >({})
  const [loadingDetailsId, setLoadingDetailsId] = useState<number | null>(
    null,
  )
  const [detailsError, setDetailsError] = useState('')

  const locationState = (
    window.history.state?.usr ?? {}
  ) as NavigationState

  const [successMessage] = useState(
  locationState.successMessage || '',
)

const [successOrderNumber] = useState(
  locationState.orderNumber || '',
)

  const loadOrders = useCallback(async () => {
    const token = localStorage.getItem('shop_token')
    const savedUser = localStorage.getItem('shop_user')

    if (!token || !savedUser) {
      navigate('/login', { replace: true })
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        navigate('/login', { replace: true })
        return
      }

      const data: OrdersResponse = await response.json()

      if (!response.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            'Unable to load your purchase history.',
        )
      }

const customerOrders = Array.isArray(data)
  ? data
  : Array.isArray(data.orders)
    ? data.orders
    : []

setOrders(customerOrders)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while loading your orders.',
      )
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  async function toggleOrderDetails(orderId: number) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
      setDetailsError('')
      return
    }

    setExpandedOrderId(orderId)
    setDetailsError('')

    if (orderDetails[orderId]) {
      return
    }

    const token = localStorage.getItem('shop_token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setLoadingDetailsId(orderId)

    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        navigate('/login', { replace: true })
        return
      }

      const data: OrderDetailsResponse & { message?: string } =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to load the order details.',
        )
      }

      const baseOrder = orders.find((order) => order.id === orderId)

      const detailedOrder: Order = {
        ...(baseOrder || { id: orderId }),
        ...(data.order || {}),
        items: data.items || data.order?.items || [],
      } as Order

      setOrderDetails((previous) => ({
        ...previous,
        [orderId]: detailedOrder,
      }))
    } catch (err) {
      setDetailsError(
        err instanceof Error
          ? err.message
          : 'Unable to load the order details.',
      )
    } finally {
      setLoadingDetailsId(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 py-16">
        <div className="mx-auto max-w-5xl text-center text-stone-600">
          Loading your purchase history...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            to="/"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Continue shopping
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
            My Purchase History
          </h1>

          <p className="mt-2 text-sm text-stone-600">
            View your CarryCraft orders, order status, and product details.
          </p>
        </div>

        {successMessage && (
          <div
            role="status"
            className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 text-green-700"
                  aria-hidden="true"
                >
                  <path
                    d="m5 12 4 4L19 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h2 className="font-semibold text-green-900">
                  Order submitted successfully!
                </h2>

                <p className="mt-1 text-sm text-green-800">
                  {successMessage}
                </p>

                {successOrderNumber && (
                  <p className="mt-2 text-sm font-semibold text-green-900">
                    Order number: {successOrderNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}

            <button
              type="button"
              onClick={() => void loadOrders()}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {!error && orders.length === 0 ? (
          <section className="rounded-2xl border border-stone-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-8 w-8 text-green-700"
                aria-hidden="true"
              >
                <path
                  d="M3 7h18l-2 13H5L3 7Z"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 9V6a4 4 0 0 1 8 0v3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-semibold text-stone-900">
              No orders yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
              When you confirm an order, it will appear here so you can
              check its status and view its details.
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Explore products
            </Link>
          </section>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const details = orderDetails[order.id]
              const isExpanded = expandedOrderId === order.id
              const items = details?.items || []

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                          Order number
                        </p>

                        <h2 className="mt-1 text-lg font-bold text-stone-900">
                          {order.order_number}
                        </h2>

                        <p className="mt-2 text-sm text-stone-500">
                          Placed on {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(order.status)}`}
                        >
                          {formatStatus(order.status)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(order.payment_status)}`}
                        >
                          Payment: {formatStatus(order.payment_status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-100 pt-5 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-stone-500">
                          Order total
                        </p>
                        <p className="mt-1 text-lg font-bold text-stone-900">
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-stone-500">
                          Products
                        </p>
                        <p className="mt-1 font-semibold text-stone-900">
                          {order.item_count ?? '—'}
                        </p>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-sm text-stone-500">
                          Shipping
                        </p>
                        <p className="mt-1 font-semibold text-stone-900">
                          {Number(order.shipping_fee) === 0
                            ? 'Free'
                            : formatPrice(order.shipping_fee)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-stone-100 pt-4">
                      <button
                        type="button"
                        onClick={() => void toggleOrderDetails(order.id)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? 'Hide order details' : 'View order details'}

                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        >
                          <path
                            d="m6 9 6 6 6-6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-stone-200 bg-stone-50 p-5 sm:p-6">
                      {loadingDetailsId === order.id && (
                        <p className="text-sm text-stone-600">
                          Loading order details...
                        </p>
                      )}

                      {detailsError && (
                        <div
                          role="alert"
                          className="text-sm text-red-700"
                        >
                          {detailsError}
                          <button
                            type="button"
                            onClick={() => {
                              setOrderDetails((previous) => {
                                const next = { ...previous }
                                delete next[order.id]
                                return next
                              })
                              void toggleOrderDetails(order.id)
                            }}
                            className="ml-2 font-semibold underline"
                          >
                            Try again
                          </button>
                        </div>
                      )}

                      {details && (
                        <div className="space-y-6">
                          <section>
                            <h3 className="font-semibold text-stone-900">
                              Products in this order
                            </h3>

                            {items.length === 0 ? (
                              <p className="mt-3 text-sm text-stone-500">
                                No product details were returned for this order.
                              </p>
                            ) : (
                              <div className="mt-4 divide-y divide-stone-200">
                                {items.map((item, index) => {
                                  const imageUrl = getImageUrl(item.image_url)

                                  return (
                                    <div
                                      key={item.id ?? `${item.product_name}-${index}`}
                                      className="flex gap-4 py-4 first:pt-0 last:pb-0"
                                    >
                                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                                        {imageUrl ? (
                                          <img
                                            src={imageUrl}
                                            alt={item.product_name}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-xs text-stone-400">
                                            No image
                                          </span>
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-stone-900">
                                          {item.product_name}
                                        </p>

                                        {item.product_sku && (
                                          <p className="mt-1 text-xs text-stone-500">
                                            SKU: {item.product_sku}
                                          </p>
                                        )}

                                        <p className="mt-2 text-sm text-stone-600">
                                          Quantity: {item.quantity}
                                        </p>
                                      </div>

                                      <div className="shrink-0 text-right">
                                        <p className="text-sm text-stone-500">
                                          Unit price
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-stone-800">
                                          {formatPrice(item.unit_price)}
                                        </p>
                                        <p className="mt-2 font-semibold text-stone-900">
                                          {formatPrice(item.line_total)}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </section>

                          <section className="border-t border-stone-200 pt-5">
                            <h3 className="font-semibold text-stone-900">
                              Delivery address
                            </h3>

                            <div className="mt-3 space-y-1 text-sm leading-6 text-stone-600">
                              {details.shipping_full_name && (
                                <p className="font-medium text-stone-900">
                                  {details.shipping_full_name}
                                </p>
                              )}

                              {details.shipping_phone && (
                                <p>{details.shipping_phone}</p>
                              )}

                              {details.shipping_address_line1 && (
                                <p>{details.shipping_address_line1}</p>
                              )}

                              {details.shipping_address_line2 && (
                                <p>{details.shipping_address_line2}</p>
                              )}

                              <p>
                                {[
                                  details.shipping_postal_code,
                                  details.shipping_city,
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              </p>

                              {details.shipping_state && (
                                <p>{details.shipping_state}</p>
                              )}

                              {details.shipping_country && (
                                <p>{details.shipping_country}</p>
                              )}
                            </div>
                          </section>

                          <section className="border-t border-stone-200 pt-5">
                            <h3 className="font-semibold text-stone-900">
                              Price breakdown
                            </h3>

                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex justify-between gap-4 text-stone-600">
                                <span>Subtotal</span>
                                <span>{formatPrice(details.subtotal)}</span>
                              </div>

                              <div className="flex justify-between gap-4 text-stone-600">
                                <span>Shipping</span>
                                <span>
                                  {Number(details.shipping_fee) === 0
                                    ? 'Free'
                                    : formatPrice(details.shipping_fee)}
                                </span>
                              </div>

                              <div className="flex justify-between gap-4 border-t border-stone-200 pt-3 font-bold text-stone-900">
                                <span>Total</span>
                                <span>{formatPrice(details.total_amount)}</span>
                              </div>
                            </div>
                          </section>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
