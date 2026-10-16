
import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminLogin } from '../lib/auth'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-700">
          CarryCraft · Administration
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          Admin login
        </h1>
        <p className="mt-2 text-slate-500">
          Sign in to manage the bag shop.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="adminEmail" className="mb-2 block text-sm font-medium">
              Admin email
            </label>
            <input
              id="adminEmail"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="adminPassword" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="adminPassword"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
              placeholder="Admin password"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in as admin'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-blue-700 hover:underline">
            Back to customer login
          </Link>
        </p>
      </section>
    </main>
  )
}
