
import { Link, Route, Routes } from 'react-router-dom'

import CustomerLogin from './pages/CustomerLogin'
import CustomerSignup from './pages/CustomerSignup'
import AdminLogin from './pages/AdminLogin'
import HomePage from './pages/HomePage.tsx'
import CategoryPage from './pages/CategoryPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import CartPage from './pages/CartPage'
import AdminDashboard from './pages/AdminDashboard.tsx'
import CustomerProfile from './pages/CustomerProfile'
import CheckoutPage from './pages/CheckoutPage.tsx'
import PurchaseHistoryPage from './pages/PurchaseHistoryPage.tsx'
import ERPImportPage from './pages/ERPImportPage.tsx'

export default function App() {
  return (
    <Routes>
      {/* Home page */}
      <Route path="/" element={<HomePage />} />

      {/* Customer authentication */}
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/signup" element={<CustomerSignup />} />

      {/* Customer pages */}
      <Route path="/customer" element={<CustomerProfile />} />
      <Route path="/profile" element={<CustomerProfile />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
      <Route path="/product/:id" element={<ProductDetailsPage />} />
      <Route path="/cart" element={<CartPage />} />

      {/* Admin pages */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/purchase-history" element={<PurchaseHistoryPage/>}/>

      <Route path="/admin/erp-import" element={<ERPImportPage />} />
      {/* Unknown routes */}
      <Route
        path="*"
        element={
          <main className="p-8 text-center">
            <p>Page not found.</p>
            <Link
              to="/login"
              className="text-blue-700 underline"
            >
              Return to login
            </Link>
          </main>
        }
      />
    </Routes>
  )
}
