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

export default function CustomerProfile() {
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function apiRequest(
    path: string,
    options: RequestInit = {},
  ) {
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

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      try {
        const data = await apiRequest('/profile')

        if (cancelled) return

        setCustomer(data.customer)
        setFullName(data.customer.full_name || '')
        setPhoneNumber(data.customer.phone_number || '')
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
        }),
      })

      setCustomer(data.customer)
      setFullName(data.customer.full_name || '')
      setPhoneNumber(data.customer.phone_number || '')
      setEditing(false)
      setMessage('Your profile has been updated successfully.')
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

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <p className="text-slate-600">Loading your profile...</p>
      </main>
    )
  }

  if (!customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-bold text-slate-900">
            Unable to load your profile
          </h1>

          <p className="mt-3 text-sm text-red-600">
            {error || 'Please log in again.'}
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
          >
            Return to login
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              CarryCraft
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your account
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </header>

        {/* Welcome card */}
        <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-bold">
              {(customer.full_name || 'C')
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <p className="text-sm text-slate-300">
                Welcome to CarryCraft!
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                Hello, {customer.full_name}.
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                Manage your personal information below.
              </p>
            </div>
          </div>
        </section>

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
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Profile */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Personal information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View and update your account details.
              </p>
            </div>

            {!editing && (
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setMessage('')
                  setEditing(true)
                }}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Edit profile
              </button>
            )}
          </div>

          <form onSubmit={saveProfile} className="space-y-5 p-6">
            <div>
              <label
                htmlFor="full_name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={customer.email}
                disabled
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-500"
              />

              <p className="mt-1 text-xs text-slate-500">
                Email changes are not available in this profile form.
              </p>
            </div>

            <div>
              <label
                htmlFor="phone_number"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Phone number
              </label>

              <input
                id="phone_number"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                disabled={!editing || saving}
                maxLength={30}
                placeholder="Enter your phone number"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            {editing && (
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setFullName(customer.full_name || '')
                    setPhoneNumber(customer.phone_number || '')
                    setEditing(false)
                    setError('')
                    setMessage('')
                  }}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            )}
          </form>
        </section>

        <p className="text-center text-sm text-slate-500">
          Your CarryCraft account information
        </p>
      </div>
    </main>
  )
}
