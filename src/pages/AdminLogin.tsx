
import {  useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminLogin } from '../lib/auth'

export default function AdminLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await adminLogin(email, password)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* LEFT: ADMIN BRANDING PANEL */}
      <section className="relative hidden min-h-screen overflow-hidden bg-stone-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-20 top-44 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-green-500/10 blur-3xl" />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex w-fit items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center bg-green-500 text-stone-950">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <rect x="4" y="7" width="16" height="14" rx="3" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
              <path d="M4 12h16M12 12v3" />
            </svg>
          </span>

          <span className="text-2xl font-bold italic tracking-tight">
            CarryCraft<span className="text-green-400">.</span>
          </span>
        </Link>

        {/* Main content */}
        <div className="relative z-10 max-w-xl py-12">
          <span className="mb-6 inline-flex items-center gap-2 border border-green-400/20 bg-green-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Administration portal
          </span>

          <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight xl:text-6xl">
            Your store.
            <br />
            Your control.
            <br />
            <span className="text-green-400">One workspace.</span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-8 text-stone-300 xl:text-lg">
            Access your administration workspace to manage products,
            review customers, and keep your CarryCraft store running.
          </p>

          {/* Feature cards */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="border border-white/10 bg-white/5 p-5">
              <span className="mb-4 flex h-10 w-10 items-center justify-center bg-green-400/15 text-green-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <rect x="4" y="4" width="6" height="6" rx="1" />
                  <rect x="14" y="4" width="6" height="6" rx="1" />
                  <rect x="4" y="14" width="6" height="6" rx="1" />
                  <rect x="14" y="14" width="6" height="6" rx="1" />
                </svg>
              </span>
              <p className="font-semibold text-white">Store management</p>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Keep products and inventory organised.
              </p>
            </div>

            <div className="border border-white/10 bg-white/5 p-5">
              <span className="mb-4 flex h-10 w-10 items-center justify-center bg-green-400/15 text-green-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="10" cy="7" r="4" />
                  <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <p className="font-semibold text-white">Customer overview</p>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Access customer and cart information.
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs tracking-wide text-stone-500">
          CARRYCRAFT · ADMINISTRATION
        </p>
      </section>

      {/* RIGHT: ADMIN LOGIN FORM */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link
            to="/"
            className="mb-10 flex w-fit items-center gap-3 lg:hidden"
          >
            <span className="flex h-11 w-11 items-center justify-center bg-green-500 text-stone-950">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <rect x="4" y="7" width="16" height="14" rx="3" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                <path d="M4 12h16M12 12v3" />
              </svg>
            </span>

            <span className="text-xl font-bold italic tracking-tight text-stone-950">
              CarryCraft<span className="text-green-600">.</span>
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-9">
            <span className="mb-5 inline-flex items-center gap-2 border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              RESTRICTED ACCESS
            </span>

            <h2 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Admin sign in
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-500 sm:text-base">
              Sign in with your administrator credentials to manage your store.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="adminEmail"
                className="mb-2 block text-sm font-semibold text-stone-700"
              >
                Admin email
              </label>

              <div className="group flex items-center gap-3 border border-stone-200 bg-white px-4 transition-all focus-within:border-green-600 focus-within:ring-4 focus-within:ring-green-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5 shrink-0 text-stone-400 transition group-focus-within:text-green-700"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m4 7 8 6 8-6" />
                </svg>

                <input
                  id="adminEmail"
                  name="email"
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="min-w-0 w-full bg-transparent py-4 text-sm text-stone-950 outline-none placeholder:text-stone-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="adminPassword"
                className="mb-2 block text-sm font-semibold text-stone-700"
              >
                Password
              </label>

              <div className="group flex items-center gap-3 border border-stone-200 bg-white px-4 transition-all focus-within:border-green-600 focus-within:ring-4 focus-within:ring-green-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5 shrink-0 text-stone-400 transition group-focus-within:text-green-700"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2.5" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <path d="M12 14v3" />
                </svg>

                <input
                  id="adminPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  className="min-w-0 w-full bg-transparent py-4 text-sm text-stone-950 outline-none placeholder:text-stone-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="shrink-0 p-1 text-stone-400 transition hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.3 2.3-2.6 3.5" />
                      <path d="M6.2 6.2C3.9 7.8 2.8 10 2.5 12c1 2.5 4.5 7 9.5 7 1 0 2-.2 2.9-.5" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5m0 3h.01" />
                </svg>
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 bg-green-500 px-5 py-4 text-sm font-semibold text-stone-950 transition-colors duration-200 hover:bg-green-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Verifying credentials...
                </>
              ) : (
                <>
                  Sign in to dashboard
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 flex items-start gap-3 border border-stone-200 bg-stone-50 p-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
              aria-hidden="true"
            >
              <path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>

            <p className="text-xs leading-5 text-stone-500">
              This area is intended for authorised administrators only.
              Keep your login credentials private.
            </p>
          </div>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 underline-offset-4 transition hover:text-green-800 hover:underline"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M19 12H5m6 6-6-6 6-6" />
              </svg>
              Back to customer login
            </Link>
          </div>

          <p className="mt-8 text-center text-xs text-stone-400">
            © {new Date().getFullYear()} CarryCraft. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  )
}
