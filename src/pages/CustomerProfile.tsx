
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../lib/auth'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface Customer {
  id: number
  full_name: string
  email: string
  phone_number: string | null
}

interface CustomerAddress {
  id?: number
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default?: boolean
}

const emptyAddress: CustomerAddress = {
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
}

export default function CustomerProfile() {
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [address, setAddress] = useState<CustomerAddress>(emptyAddress)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function apiRequest(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('shop_token')

    if (!token) {
      throw new Error('Please log in to view your profile.')
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'Request failed.')
    }

    return data
  }

  function applyAddress(savedAddress: Partial<CustomerAddress> | null) {
    setAddress({
      address_line1: savedAddress?.address_line1 || '',
      address_line2: savedAddress?.address_line2 || '',
      city: savedAddress?.city || '',
      state: savedAddress?.state || '',
      postal_code: savedAddress?.postal_code || '',
      country: savedAddress?.country || '',
      id: savedAddress?.id,
      is_default: savedAddress?.is_default,
    })
  }

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const data = await apiRequest('/profile')

        if (cancelled) return

        setCustomer(data.customer)
        setFullName(data.customer.full_name || '')
        setPhoneNumber(data.customer.phone_number || '')
        applyAddress(data.address || null)
      } catch (err) {
        if (cancelled) return

        setError(
          err instanceof Error
            ? err.message
            : 'Could not load your profile.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [])

  function updateAddress(
    field: keyof CustomerAddress,
    value: string,
  ) {
    setAddress((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      const data = await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          phone_number: phoneNumber,
          address: {
            address_line1: address.address_line1,
            address_line2: address.address_line2,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
          },
        }),
      })

      setCustomer(data.customer)
      setFullName(data.customer.full_name || '')
      setPhoneNumber(data.customer.phone_number || '')
      applyAddress(data.address || null)
      setEditing(false)
      setMessage('Your profile and address have been updated successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not update your profile.',
      )
    } finally {
      setSaving(false)
    }
  }

  function cancelEditing() {
    if (!customer) return

    setFullName(customer.full_name || '')
    setPhoneNumber(customer.phone_number || '')
    applyAddress(addressFromCustomer)
    setEditing(false)
    setError('')
    setMessage('')
  }

  // Keep a snapshot of the last address received from the server.
  const [addressFromCustomer] =
    useState<CustomerAddress>(emptyAddress)

  // function saveAddressSnapshot(savedAddress: Partial<CustomerAddress> | null) {
  //   setAddressFromCustomer({
  //     address_line1: savedAddress?.address_line1 || '',
  //     address_line2: savedAddress?.address_line2 || '',
  //     city: savedAddress?.city || '',
  //     state: savedAddress?.state || '',
  //     postal_code: savedAddress?.postal_code || '',
  //     country: savedAddress?.country || '',
  //     id: savedAddress?.id,
  //     is_default: savedAddress?.is_default,
  //   })
  // }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  // Load the address snapshot when the server returns the profile.
  // The helper below updates both the editable address and its snapshot.
  // function setLoadedAddress(savedAddress: Partial<CustomerAddress> | null) {
  //   const normalized: CustomerAddress = {
  //     address_line1: savedAddress?.address_line1 || '',
  //     address_line2: savedAddress?.address_line2 || '',
  //     city: savedAddress?.city || '',
  //     state: savedAddress?.state || '',
  //     postal_code: savedAddress?.postal_code || '',
  //     country: savedAddress?.country || '',
  //     id: savedAddress?.id,
  //     is_default: savedAddress?.is_default,
  //   }

  //   setAddress(normalized)
  //   setAddressFromCustomer(normalized)
  // }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin border-4 border-stone-200 border-t-green-500" />
          <p className="text-sm font-medium text-stone-600">
            Loading your profile...
          </p>
        </div>
      </main>
    )
  }

  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
        <section className="w-full max-w-lg border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <h1 className="text-2xl font-bold text-stone-950">
            Unable to load your profile
          </h1>
          <p className="mt-3 text-sm leading-6 text-red-700">
            {error || 'Please log in again to access your account.'}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 bg-green-500 px-5 py-3.5 text-sm font-bold text-stone-950 hover:bg-green-400"
          >
            Return to login
          </button>
        </section>
      </main>
    )
  }

  const initials = (customer.full_name || 'C')
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-left"
            aria-label="Go to CarryCraft homepage"
          >
            <span className="font-serif text-2xl font-bold italic tracking-tight text-stone-950">
              CarryCraft<span className="text-green-500">.</span>
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
              Carry what matters
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-950 hover:text-white"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">
            Your account
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
            My profile<span className="text-green-500">.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600 sm:text-base">
            Manage your personal details and saved address.
          </p>
        </div>

        <section className="relative overflow-hidden bg-stone-950 px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-green-500/10" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-green-500/40 bg-green-500 text-3xl font-bold text-stone-950">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-green-400">
                Welcome back to CarryCraft
              </p>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Hello, {customer.full_name || 'Customer'}!
              </h2>
              <p className="mt-2 text-sm text-stone-300">
                Your account, your details, all in one place.
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div
            role="status"
            className="mt-6 border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={saveProfile}>
          <section className="mt-8 border border-stone-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-stone-200 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">
                  Account details
                </p>
                <h2 className="mt-2 text-xl font-bold text-stone-950">
                  Personal information
                </h2>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setMessage('')
                    setEditing(true)
                  }}
                  className="bg-green-500 px-5 py-3 text-sm font-bold text-stone-950 hover:bg-green-400"
                >
                  Edit profile
                </button>
              )}
            </div>

            <div className="grid gap-6 px-6 py-7 sm:grid-cols-2 sm:px-8 sm:py-8">
              <div>
                <label htmlFor="full_name" className="mb-2 block text-sm font-semibold text-stone-800">
                  Full name
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  disabled={!editing || saving}
                  required
                  maxLength={100}
                  autoComplete="name"
                  className="w-full border border-stone-300 px-4 py-3.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/20 disabled:bg-stone-50 disabled:text-stone-600"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-stone-800">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={customer.email}
                  disabled
                  className="w-full border border-stone-200 bg-stone-100 px-4 py-3.5 text-sm text-stone-500"
                />
                <p className="mt-2 text-xs text-stone-500">
                  Email changes are not available here.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="phone_number" className="mb-2 block text-sm font-semibold text-stone-800">
                  Phone number
                </label>
                <input
                  id="phone_number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  disabled={!editing || saving}
                  maxLength={30}
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  className="w-full border border-stone-300 px-4 py-3.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/20 disabled:bg-stone-50 disabled:text-stone-600"
                />
              </div>
            </div>
          </section>

          {/* Saved address */}
          <section className="mt-8 border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-6 py-6 sm:px-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">
                Delivery details
              </p>
              <h2 className="mt-2 text-xl font-bold text-stone-950">
                Saved address
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                Add or update the address you may use for future deliveries.
              </p>
            </div>

            <div className="grid gap-6 px-6 py-7 sm:grid-cols-2 sm:px-8 sm:py-8">
              <div className="sm:col-span-2">
                <label htmlFor="address_line1" className="mb-2 block text-sm font-semibold text-stone-800">
                  Address line 1
                </label>
                <input
                  id="address_line1"
                  value={address.address_line1}
                  onChange={(event) => updateAddress('address_line1', event.target.value)}
                  disabled={!editing || saving}
                  maxLength={255}
                  autoComplete="address-line1"
                  placeholder="Street and house number"
                  className="w-full border border-stone-300 px-4 py-3.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/20 disabled:bg-stone-50 disabled:text-stone-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address_line2" className="mb-2 block text-sm font-semibold text-stone-800">
                  Address line 2 <span className="font-normal text-stone-400">(optional)</span>
                </label>
                <input
                  id="address_line2"
                  value={address.address_line2}
                  onChange={(event) => updateAddress('address_line2', event.target.value)}
                  disabled={!editing || saving}
                  maxLength={255}
                  autoComplete="address-line2"
                  placeholder="Apartment, floor, building, etc."
                  className="w-full border border-stone-300 px-4 py-3.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/20 disabled:bg-stone-50 disabled:text-stone-600"
                />
              </div>

              <div>
                <label htmlFor="city" className="mb-2 block text-sm font-semibold text-stone-800">
                  City
                </label>
                <input
                  id="city"
                  value={address.city}
                  onChange={(event) => updateAddress('city', event.target.value)}
                  disabled={!editing || saving}
                  maxLength={120}
                  autoComplete="address-level2"
                  placeholder="City"
                  className="w-full border border-stone-300 px-4 py-3.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/20 disabled:bg-stone-50 disabled:text-stone-600"
                />
              </div>

              <div>
                <label htmlFor="state" className="mb-2 block text-sm font-semibold text-stone-800">
                  State / Region <span className="font-normal text-stone-400">(optional)</span>
                </label>
                <input
                  id="state"
                  value={address.state}
                  onChange={(event) => updateAddress('state', event.target.value)}
                  disabled={!editing || saving}
                  maxLength={120}
                  autoComplete="address-level1"
                  placeholder="State or region"
                  className="w-full border border-stone-300 px-4 py-3.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/20 disabled:bg-stone-50 disabled:text-stone-600"
                />
              </div>

              <div>
                <label htmlFor="postal_code" className="mb-2 block text-sm font-semibold text-stone-800">
                  Postal code
                </label>
                <input
                  id="postal_code"
                  value={address.postal_code}
                  onChange={(event) => updateAddress('postal_code', event.target.value)}
                  disabled={!editing || saving}
                  maxLength={20}
                  autoComplete="postal-code"
                  placeholder="Postal code"
                  className="w-full border border-stone-300 px-4 py-3.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/20 disabled:bg-stone-50 disabled:text-stone-600"
                />
              </div>

              <div>
                <label htmlFor="country" className="mb-2 block text-sm font-semibold text-stone-800">
                  Country
                </label>
                <input
                  id="country"
                  value={address.country}
                  onChange={(event) => updateAddress('country', event.target.value)}
                  disabled={!editing || saving}
                  maxLength={100}
                  autoComplete="country-name"
                  placeholder="Country"
                  className="w-full border border-stone-300 px-4 py-3.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/20 disabled:bg-stone-50 disabled:text-stone-600"
                />
              </div>
            </div>
          </section>

          {editing && (
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={cancelEditing}
                className="border border-stone-300 px-6 py-3 text-sm font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-green-500 px-6 py-3 text-sm font-bold text-stone-950 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving changes...' : 'Save changes'}
              </button>
            </div>
          )}
        </form>

        <section className="mt-8 bg-stone-950 p-6 text-white sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-400">
            CarryCraft
          </p>
          <h2 className="mt-3 text-lg font-bold">Ready for your next journey?</h2>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Keep your profile details up to date for a smoother shopping experience.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 bg-green-500 px-5 py-3 text-sm font-bold text-stone-950 hover:bg-green-400"
          >
            Continue shopping →
          </button>
        </section>

        <footer className="mt-10 border-t border-stone-200 py-6 text-center">
          <p className="font-serif text-lg font-bold italic text-stone-800">
            CarryCraft<span className="text-green-500">.</span>
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Carry what matters.
          </p>
        </footer>
      </div>
    </main>
  )
}
