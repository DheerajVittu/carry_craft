
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const API_ORIGIN = API_URL.replace(/\/api\/?$/, '')

type CartItem = {
  product_id: number
  name: string
  brand?: string | null
  price: number | string
  image_url: string | null
  quantity: number
  stock_quantity?: number
}

type Address = {
  full_name: string
  phone_number: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
}

type ProfileResponse = {
  customer?: {
    full_name?: string
    phone_number?: string | null
  }
  address?: Partial<Address> | null
}

// type OrderResponse = {
//   message?: string
//   order?: {
//     id?: number
//     order_number?: string
//   }
// }

const emptyAddress: Address = {
  full_name: '',
  phone_number: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'Germany',
}

function getToken() {
  return localStorage.getItem('shop_token')
}

function getImageUrl(imageUrl: string | null) {
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

function formatPrice(value: number | string) {
  const amount = Number(value)

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number.isFinite(amount) ? amount : 0)
}

function mapAddress(
  savedAddress?: Partial<Address> | null,
  customer?: ProfileResponse['customer'],
): Address {
  return {
    full_name:
      savedAddress?.full_name || customer?.full_name || '',
    phone_number:
      savedAddress?.phone_number || customer?.phone_number || '',
    address_line1: savedAddress?.address_line1 || '',
    address_line2: savedAddress?.address_line2 || '',
    city: savedAddress?.city || '',
    state: savedAddress?.state || '',
    postal_code: savedAddress?.postal_code || '',
    country: savedAddress?.country || 'Germany',
  }
}

export default function CheckoutPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState<CartItem[]>([])
  const [address, setAddress] = useState<Address>(emptyAddress)
  const [hasSavedAddress, setHasSavedAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [loading, setLoading] = useState(true)
  const [placingOrder] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const subtotal = items.reduce(
    (total, item) =>
      total + Number(item.price || 0) * item.quantity,
    0,
  )

  const shippingFee = 0
  const total = subtotal + shippingFee

  const loadCheckout = useCallback(async () => {
    const token = getToken()
    const savedUser = localStorage.getItem('shop_user')

    if (!token || !savedUser) {
      navigate('/login', { replace: true })
      return
    }

    setLoading(true)
    setError('')
    setNotice('')

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [cartResponse, profileResponse] = await Promise.all([
        fetch(`${API_URL}/cart`, { headers }),
        fetch(`${API_URL}/profile`, { headers }),
      ])

      if (
        cartResponse.status === 401 ||
        cartResponse.status === 403 ||
        profileResponse.status === 401 ||
        profileResponse.status === 403
      ) {
        navigate('/login', { replace: true })
        return
      }

      if (!cartResponse.ok) {
        throw new Error('Unable to load your cart. Please try again.')
      }

      if (!profileResponse.ok) {
        throw new Error(
          'Unable to load your delivery details. Please try again.',
        )
      }

      const cartData = await cartResponse.json()
      const profileData: ProfileResponse = await profileResponse.json()

      const cartItems: CartItem[] = Array.isArray(cartData.items)
        ? cartData.items
        : []

      setItems(cartItems)

      const savedAddress = profileData.address
      const hasAddress = Boolean(
        savedAddress?.address_line1 &&
          savedAddress?.city &&
          savedAddress?.postal_code &&
          savedAddress?.country,
      )

      setHasSavedAddress(hasAddress)
      setAddress(mapAddress(savedAddress, profileData.customer))
      setEditingAddress(!hasAddress)

      if (cartItems.length === 0) {
        setNotice('Your cart is empty.')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while loading checkout.',
      )
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadCheckout()
  }, [loadCheckout])

  function updateAddress(
    field: keyof Address,
    value: string,
  ) {
    setAddress((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  // function validateAddress() {
  //   const requiredFields: Array<keyof Address> = [
  //     'full_name',
  //     'phone_number',
  //     'address_line1',
  //     'city',
  //     'postal_code',
  //     'country',
  //   ]

  //   for (const field of requiredFields) {
  //     if (!address[field].trim()) {
  //       return 'Please complete all required delivery address fields.'
  //     }
  //   }

  //   return ''
  // }

  
async function handlePlaceOrder() {
  // Ask for confirmation before sending the order to the backend.
  const confirmed = window.confirm(
    'Are you sure you want to confirm this order?'
  )

  if (!confirmed) {
    return
  }

  const token = localStorage.getItem('shop_token')

  if (!token) {
    navigate('/login')
    return
  }

  setError('')
  setLoading(true)

  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipping_address: address,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.message || 'Could not confirm your order.'
      )
    }

    // Show success only after the backend saves the order.
    window.alert('Your order has been confirmed!')

    // Return to the homepage instead of purchase history.
    navigate('/', { replace: true })
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Could not confirm your order. Please try again.'
    )
  } finally {
    setLoading(false)
  }
}


  function cancelAddressEditing() {
    void loadCheckout()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 py-20">
        <div className="mx-auto max-w-6xl text-center text-stone-600">
          Loading checkout...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            to="/cart"
            className="text-sm font-medium text-green-700 hover:text-green-800"
          >
            ← Back to cart
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-stone-600">
            Review your items and confirm your delivery details.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && items.length === 0 && (
          <div className="mb-6 rounded-xl border border-stone-200 bg-white px-4 py-5 text-stone-700">
            <p>{notice}</p>
            <Link
              to="/"
              className="mt-3 inline-block font-semibold text-green-700 hover:text-green-800"
            >
              Continue shopping →
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            {/* LEFT SIDE: Cart items and order summary */}
            <section className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-semibold text-stone-900">
                  Order items ({items.length})
                </h2>

                <div className="mt-5 divide-y divide-stone-100">
                  {items.map((item) => {
                    const imageUrl = getImageUrl(item.image_url)

                    return (
                      <div
                        key={item.product_id}
                        className="flex gap-4 py-5 first:pt-0 last:pb-0"
                      >
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-stone-400">
                              No image
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-stone-900">
                            {item.name}
                          </h3>

                          {item.brand && (
                            <p className="mt-1 text-sm text-stone-500">
                              {item.brand}
                            </p>
                          )}

                          <p className="mt-2 text-sm text-stone-600">
                            Quantity: {item.quantity}
                          </p>

                          <p className="mt-3 font-semibold text-stone-900">
                            {formatPrice(
                              Number(item.price) * item.quantity,
                            )}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm text-stone-500">
                            Unit price
                          </p>
                          <p className="mt-1 font-medium text-stone-800">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-semibold text-stone-900">
                  Order summary
                </h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 text-stone-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between gap-4 text-stone-600">
                    <span>Shipping</span>
                    <span className="font-medium text-green-700">
                      {shippingFee === 0
                        ? 'Free'
                        : formatPrice(shippingFee)}
                    </span>
                  </div>

                  <div className="border-t border-stone-200 pt-4">
                    <div className="flex justify-between gap-4 text-base font-bold text-stone-900">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-stone-500">
                  The final total is calculated and validated by the server
                  when you confirm your order.
                </p>
              </div>
            </section>

            {/* RIGHT SIDE: Delivery details and Confirm Order */}
            <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-stone-900">
                Delivery details
              </h2>

              {hasSavedAddress && !editingAddress ? (
                <>
                  <div className="mt-5 space-y-3 text-sm text-stone-600">
                    <p className="font-semibold text-stone-900">
                      {address.full_name}
                    </p>

                    <p>{address.phone_number}</p>

                    <p>
                      {address.address_line1}
                      {address.address_line2
                        ? `, ${address.address_line2}`
                        : ''}
                    </p>

                    <p>
                      {address.postal_code} {address.city}
                    </p>

                    {address.state && <p>{address.state}</p>}

                    <p>{address.country}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingAddress(true)}
                    className="mt-5 text-sm font-semibold hover:cursor-pointer text-green-700 hover:text-green-800"
                  >
                    Edit delivery address
                  </button>

                  <div className="mt-6 border-t border-stone-200 pt-5">
                    <p className="text-sm leading-6 text-stone-500">
                      Your order will be placed using the delivery address
                      shown above.
                    </p>

                    <button
                      type="button"
                      onClick={() => void handlePlaceOrder()}
                      disabled={placingOrder}
                      className="mt-5 w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {placingOrder
                        ? 'Confirming Order...'
                        : 'Confirm Order'}
                    </button>
                  </div>
                </>
              ) : (
                <form
  onSubmit={(event) => {
    event.preventDefault()
    void handlePlaceOrder()
  }}
  className="mt-5 space-y-4"
>
                  {!hasSavedAddress && (
                    <p className="text-sm leading-6 text-stone-500">
                      Please enter your delivery details to continue.
                    </p>
                  )}

                  <div>
                    <label
                      htmlFor="full_name"
                      className="mb-1.5 block text-sm font-medium text-stone-700"
                    >
                      Full name *
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      autoComplete="name"
                      required
                      value={address.full_name}
                      onChange={(event) =>
                        updateAddress('full_name', event.target.value)
                      }
                      className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone_number"
                      className="mb-1.5 block text-sm font-medium text-stone-700"
                    >
                      Phone number *
                    </label>
                    <input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={address.phone_number}
                      onChange={(event) =>
                        updateAddress('phone_number', event.target.value)
                      }
                      className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="address_line1"
                      className="mb-1.5 block text-sm font-medium text-stone-700"
                    >
                      Address line 1 *
                    </label>
                    <input
                      id="address_line1"
                      name="address_line1"
                      autoComplete="address-line1"
                      required
                      value={address.address_line1}
                      onChange={(event) =>
                        updateAddress('address_line1', event.target.value)
                      }
                      placeholder="Street and house number"
                      className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="address_line2"
                      className="mb-1.5 block text-sm font-medium text-stone-700"
                    >
                      Address line 2
                    </label>
                    <input
                      id="address_line2"
                      name="address_line2"
                      autoComplete="address-line2"
                      value={address.address_line2}
                      onChange={(event) =>
                        updateAddress('address_line2', event.target.value)
                      }
                      placeholder="Apartment, floor, etc. (optional)"
                      className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="postal_code"
                        className="mb-1.5 block text-sm font-medium text-stone-700"
                      >
                        Postal code *
                      </label>
                      <input
                        id="postal_code"
                        name="postal_code"
                        autoComplete="postal-code"
                        required
                        value={address.postal_code}
                        onChange={(event) =>
                          updateAddress('postal_code', event.target.value)
                        }
                        className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="city"
                        className="mb-1.5 block text-sm font-medium text-stone-700"
                      >
                        City *
                      </label>
                      <input
                        id="city"
                        name="city"
                        autoComplete="address-level2"
                        required
                        value={address.city}
                        onChange={(event) =>
                          updateAddress('city', event.target.value)
                        }
                        className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="state"
                      className="mb-1.5 block text-sm font-medium text-stone-700"
                    >
                      State / Region
                    </label>
                    <input
                      id="state"
                      name="state"
                      autoComplete="address-level1"
                      value={address.state}
                      onChange={(event) =>
                        updateAddress('state', event.target.value)
                      }
                      className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="mb-1.5 block text-sm font-medium text-stone-700"
                    >
                      Country *
                    </label>
                    <input
                      id="country"
                      name="country"
                      autoComplete="country-name"
                      required
                      value={address.country}
                      onChange={(event) =>
                        updateAddress('country', event.target.value)
                      }
                      className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="hover:cursor-pointer w-full rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {placingOrder
                      ? 'Confirming Order...'
                      : 'Confirm Order'}
                  </button>

                  {hasSavedAddress && (
                    <button
                      type="button"
                      onClick={cancelAddressEditing}
                      disabled={placingOrder}
                      className="w-full rounded-xl border border-stone-300 px-5 py-3 font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
                    >
                      Cancel editing
                    </button>
                  )}
                </form>
              )}

              {/* <div className="mt-6 rounded-xl bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-800">
                  Payment
                </p>
                <p className="mt-1 text-sm leading-5 text-stone-500">
                  Payment status will remain pending until a payment method
                  is integrated and payment is completed.
                </p>
              </div> */}
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
