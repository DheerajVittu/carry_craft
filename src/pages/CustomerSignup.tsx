
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { customerSignup } from '../lib/auth'

export default function CustomerSignup() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      await customerSignup({
        full_name: fullName,
        email,
        phone_number: phone,
        password,
        confirmPassword,
      })

      navigate('/customer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'min-w-0 w-full bg-transparent py-3 text-sm text-stone-950 outline-none placeholder:text-stone-400'

  const fieldClass =
    'group flex items-center gap-3 border border-stone-200 bg-white px-4 transition-all focus-within:border-green-600 focus-within:ring-4 focus-within:ring-green-100'

  const labelClass =
    'mb-2 block text-sm font-semibold text-stone-700'

  function FieldIcon({
    type,
  }: {
    type: 'user' | 'email' | 'phone' | 'lock'
  }) {
    const paths = {
      user: (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </>
      ),
      email: (
        <>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m4 7 8 6 8-6" />
        </>
      ),
      phone: (
        <>
          <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M10 17h4" />
        </>
      ),
      lock: (
        <>
          <rect x="4" y="10" width="16" height="11" rx="2.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <path d="M12 14v3" />
        </>
      ),
    }

    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-5 w-5 shrink-0 text-stone-400 transition group-focus-within:text-green-700"
        aria-hidden="true"
      >
        {paths[type]}
      </svg>
    )
  }

  function VisibilityButton({
    visible,
    onToggle,
    label,
  }: {
    visible: boolean
    onToggle: () => void
    label: string
  }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
        aria-pressed={visible}
        className="shrink-0 p-1 text-stone-400 transition hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        {visible ? (
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
    )
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* LEFT: BRANDING PANEL */}
      <section className="relative hidden min-h-screen overflow-hidden bg-stone-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-20 top-44 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-green-500/10 blur-3xl" />

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

        <div className="relative z-10 max-w-xl py-12">
          <span className="mb-6 inline-flex items-center gap-2 border border-green-400/20 bg-green-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Your journey begins here
          </span>

          <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight xl:text-6xl">
            Make room
            <br />
            for your next
            <br />
            <span className="text-green-400">adventure.</span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-8 text-stone-300 xl:text-lg">
            Join CarryCraft and find your everyday companion.
            From campus to city breaks, your next favourite bag
            is waiting for you.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="border border-white/10 bg-white/5 p-5">
              <p className="text-lg font-semibold text-white">Your style</p>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Find a bag that feels like you.
              </p>
            </div>

            <div className="border border-white/10 bg-white/5 p-5">
              <p className="text-lg font-semibold text-white">Your journey</p>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Be ready for wherever life takes you.
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs tracking-wide text-stone-500">
          CARRYCRAFT · MADE FOR YOUR NEXT CHAPTER
        </p>
      </section>

      {/* RIGHT: SIGNUP FORM */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <Link
            to="/"
            className="mb-8 flex w-fit items-center gap-3 lg:hidden"
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

          <div className="mb-7">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-green-700">
              Join CarryCraft
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Create your account
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-500 sm:text-base">
              A few details, and you're ready for your next adventure.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full name
              </label>
              <div className={fieldClass}>
                <FieldIcon type="user" />
                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email address
              </label>
              <div className={fieldClass}>
                <FieldIcon type="email" />
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
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone number
              </label>
              <div className={fieldClass}>
                <FieldIcon type="phone" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 123 456789"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className={fieldClass}>
                <FieldIcon type="lock" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={inputClass}
                />
                <VisibilityButton
                  visible={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  label="password"
                />
              </div>
              <p className="mt-2 text-xs text-stone-400">
                Use at least 8 characters.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm password
              </label>
              <div className={fieldClass}>
                <FieldIcon type="lock" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Enter your password again"
                  className={inputClass}
                />
                <VisibilityButton
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((prev) => !prev)}
                  label="confirmation password"
                />
              </div>

              {confirmPassword && (
                <p
                  className={`mt-2 text-xs ${
                    password === confirmPassword
                      ? 'text-green-700'
                      : 'text-red-600'
                  }`}
                >
                  {password === confirmPassword
                    ? 'Passwords match.'
                    : 'Passwords do not match.'}
                </p>
              )}
            </div>

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
                  Creating your account...
                </>
              ) : (
                <>
                  Create your account
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

          <div className="mt-7 text-center">
            <p className="text-sm text-stone-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-green-700 underline-offset-4 transition hover:text-green-800 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-7 text-center text-xs leading-5 text-stone-400">
            By creating an account, you can access your CarryCraft customer account.
          </p>

          <p className="mt-5 text-center text-xs text-stone-400">
            © {new Date().getFullYear()} CarryCraft. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  )
}
