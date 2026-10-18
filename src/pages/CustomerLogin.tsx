
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { customerLogin } from '../lib/auth'

export default function CustomerLogin() {
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
      await customerLogin(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white text-stone-900 lg:grid lg:grid-cols-2">

      {/* LEFT: BRANDING PANEL */}
      <section className="relative hidden min-h-screen overflow-hidden bg-stone-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">

        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-20 top-44 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-green-500/10 blur-3xl" />

        {/* Brand */}
        <Link to="/" className="relative z-10 flex w-fit items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center bg-green-500 text-stone-950 shadow-lg shadow-green-950/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <rect x="4" y="7" width="16" height="14" rx="3" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
              <path d="M4 12h16M12 12v3" />
            </svg>
          </span>

          <span className="font-serif text-2xl font-bold italic tracking-tight">
            CarryCraft<span className="text-green-400">.</span>
          </span>
        </Link>

        {/* Main message */}
        <div className="relative z-10 max-w-xl py-12">
          <span className="mb-6 inline-flex items-center gap-2 border border-green-400/20 bg-green-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-green-300">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Carry your world
          </span>

          <h1 className="text-5xl font-black leading-[1.08] tracking-tight xl:text-6xl">
            Every journey
            <br />
            starts with the
            <br />
            <span className="text-green-400">right bag.</span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-8 text-stone-300 xl:text-lg">
            From everyday essentials to unforgettable adventures,
            find a bag that goes wherever life takes you.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-5">
            {[
              'Style that fits your everyday life',
              'Space for everything that matters',
              'Ready for wherever you are going',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                </span>

                <span className="text-sm text-stone-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs tracking-wide text-stone-500">
          CARRYCRAFT · MADE FOR YOUR NEXT CHAPTER
        </p>
      </section>

      {/* RIGHT: LOGIN FORM */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">

          {/* Mobile brand */}
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
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <rect x="4" y="7" width="16" height="14" rx="3" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                <path d="M4 12h16M12 12v3" />
              </svg>
            </span>

            <span className="font-serif text-xl font-bold italic tracking-tight text-stone-950">
              CarryCraft<span className="text-green-600">.</span>
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-9">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-green-700">
              Welcome back
            </p>

            <h2 className="text-3xl font-black tracking-tight text-stone-950 sm:text-4xl">
              Sign in to CarryCraft
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-500 sm:text-base">
              Welcome back! Enter your details to access your account.
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-stone-800"
              >
                Email address
              </label>

              <div className="group flex items-center gap-3 border border-stone-200 bg-white px-4 transition-all focus-within:border-green-600 focus-within:ring-4 focus-within:ring-green-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0 text-stone-400 transition group-focus-within:text-green-700"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m4 7 8 6 8-6" />
                </svg>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 w-full bg-transparent py-4 text-sm text-stone-900 outline-none placeholder:text-stone-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-stone-800"
              >
                Password
              </label>

              <div className="group flex items-center gap-3 border border-stone-200 bg-white px-4 transition-all focus-within:border-green-600 focus-within:ring-4 focus-within:ring-green-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0 text-stone-400 transition group-focus-within:text-green-700"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2.5" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <path d="M12 14v3" />
                </svg>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="min-w-0 w-full bg-transparent py-4 text-sm text-stone-900 outline-none placeholder:text-stone-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="shrink-0 rounded-md p-1 text-stone-400 transition hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
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

            {/* Error message */}
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 bg-green-500 px-5 py-4 text-sm font-bold uppercase tracking-wider text-stone-950 shadow-lg shadow-green-950/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-400 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
                  Signing you in...
                </>
              ) : (
                <>
                  Sign in to your account
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

          {/* Signup link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-stone-500">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-bold text-green-700 underline-offset-4 transition hover:text-green-800 hover:underline"
              >
                Create account
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs font-medium text-stone-400">OR</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          {/* Admin login */}
          <Link
            to="/admin/login"
            className="flex items-center justify-center gap-2 border border-stone-200 bg-white px-4 py-3.5 text-sm font-semibold text-stone-700 transition hover:border-green-600 hover:bg-green-50 hover:text-green-800"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <rect x="3" y="10" width="18" height="11" rx="2" />
              <path d="M7 10V7a5 5 0 0 1 10 0v3" />
              <circle cx="12" cy="15" r="1" />
            </svg>

            Administrator login
          </Link>

          <p className="mt-8 text-center text-xs text-stone-400">
            © {new Date().getFullYear()} CarryCraft. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  )
}
