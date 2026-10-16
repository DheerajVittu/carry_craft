
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import CustomerLogin from './pages/CustomerLogin'
import CustomerSignup from './pages/CustomerSignup'
import AdminLogin from './pages/AdminLogin'
import { logout } from './lib/auth'
import HomePage from "./Pages/HomePage.tsx";
import CategoryPage from './Pages/CategoryPage'
import ProductDetailsPage from './Pages/ProductDetailsPage'
import CartPage from "./Pages/CartPage";
import AdminDashboard from './Pages/AdminDashboard.tsx'
import CustomerProfile from './pages/CustomerProfile'
function Destination({ admin = false }: { admin?: boolean }) {
  const navigate = useNavigate()
  const userText = localStorage.getItem('shop_user')
  const user = userText ? JSON.parse(userText) : null

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">
          {admin ? 'Admin login successful!' : 'Welcome to CarryCraft!'}
        </h1>
        <p className="mt-3 text-slate-600">
          {user?.full_name
            ? `Hello, ${user.full_name}.`
            : 'Your authentication request succeeded.'}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {admin
            ? 'Your admin dashboard will be built next.'
            : 'Your customer shop page will be built next.'}
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
        >
          Log out
        </button>
      </section>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/login" element={<CustomerLogin />} />
        <Route
            path="/product/:id"
            element={<ProductDetailsPage />}
        />
        <Route path="/cart" element={<CartPage />} />
        <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
        />
        <Route path="/profile" element={<CustomerProfile />} />
        <Route path="/customer" element={<CustomerProfile />} />
        <Route path="/signup" element={<CustomerSignup />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/customer" element={<Destination />} />
      <Route path="/admin/dashboard" element={<Destination admin />} />
      <Route path="*" element={
        <main className="p-8 text-center">
          <p>Page not found.</p>
          <Link to="/login" className="text-blue-700 underline">
            Return to login
          </Link>
        </main>
      } />
    </Routes>
  )
}
