import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../lib/auth'
import { AdminProductManager } from './uploader_deploader/AdminProductManager'

const API_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

type Tab = 'overview' | 'products' | 'customers' | 'orders'

type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'

type PaymentStatus =
    | 'pending'
    | 'paid'
    | 'failed'
    | 'refunded'

interface Product {
    id: number
    name: string
    brand: string | null
    price: number | string
    stock_quantity: number
    category_display_name: string | null
    image_url: string | null
    is_active: boolean
}

interface Customer {
    id: number
    full_name: string
    email: string
    phone_number: string | null
}

interface OrderItem {
    id: number
    product_id: number | null
    product_name: string
    product_sku: string | null
    image_url: string | null
    quantity: number
    unit_price: number | string
    line_total: number | string
}

interface Order {
    id: number
    order_number: string
    status: OrderStatus
    payment_status: PaymentStatus
    subtotal: number | string
    shipping_fee: number | string
    total_amount: number | string
    created_at: string

    customer_name: string
    customer_email: string

    shipping_full_name?: string | null
    shipping_phone?: string | null
    shipping_address_line1?: string | null
    shipping_address_line2?: string | null
    shipping_city?: string | null
    shipping_state?: string | null
    shipping_postal_code?: string | null
    shipping_country?: string | null

    item_count: number
    items: OrderItem[]
}

interface Summary {
    products: number
    customers: number
    carts?: number
    cart_items?: number
}

function formatStatus(status?: string) {
    if (!status) return 'Unknown'

    return status
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase())
}

function getStatusClasses(status?: string) {
    switch (status?.toLowerCase()) {
        case 'confirmed':
        case 'processing':
        case 'paid':
            return 'bg-blue-50 text-blue-700'

        case 'shipped':
            return 'bg-purple-50 text-purple-700'

        case 'delivered':
            return 'bg-emerald-50 text-emerald-700'

        case 'cancelled':
        case 'failed':
            return 'bg-red-50 text-red-700'

        case 'refunded':
            return 'bg-slate-200 text-slate-700'

        default:
            return 'bg-amber-50 text-amber-700'
    }
}

export default function AdminDashboard() {
    const navigate = useNavigate()

    const [tab, setTab] = useState<Tab>('overview')

    const [products, setProducts] = useState<Product[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [orders, setOrders] = useState<Order[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    const [searchTerm, setSearchTerm] = useState('')
    const [appliedSearch, setAppliedSearch] = useState('')

    // Product category filter
    const [selectedProductCategory, setSelectedProductCategory] =
        useState('all')

    const [updatingOrderId, setUpdatingOrderId] =
        useState<number | null>(null)

    const token = localStorage.getItem('shop_token')

    let user: {
        role?: string
        full_name?: string
        email?: string
    } | null = null

    try {
        user = JSON.parse(localStorage.getItem('shop_user') || 'null')
    } catch {
        user = null
    }

    useEffect(() => {
        if (!notice) return

        const timer = window.setTimeout(() => {
            setNotice('')
        }, 3000)

        return () => window.clearTimeout(timer)
    }, [notice])

    const api = useCallback(
        async (path: string, options: RequestInit = {}) => {
            const currentToken = localStorage.getItem('shop_token')

            if (!currentToken) {
                throw new Error(
                    'Your session has expired. Please log in again.'
                )
            }

            const response = await fetch(`${API_URL}${path}`, {
                ...options,
                headers: {
                    ...(options.body
                        ? { 'Content-Type': 'application/json' }
                        : {}),
                    ...options.headers,
                    Authorization: `Bearer ${currentToken}`,
                },
            })

            const data = await response.json().catch(() => ({}))

            if (response.status === 401 || response.status === 403) {
                logout()
                navigate('/admin/login', { replace: true })

                throw new Error(
                    data.message || 'Admin access denied.'
                )
            }

            if (!response.ok) {
                throw new Error(
                    data.message || 'The request could not be completed.'
                )
            }

            return data
        },
        [navigate]
    )

    const loadDashboard = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const searchPath = appliedSearch
                ? `/admin/orders?search=${encodeURIComponent(appliedSearch)}`
                : '/admin/orders'

            const [
                summaryData,
                productData,
                customerData,
                orderData,
            ] = await Promise.all([
                api('/admin/summary'),
                api('/admin/products'),
                api('/admin/customers'),
                api(searchPath),
            ])

            setSummary(summaryData)
            setProducts(Array.isArray(productData) ? productData : [])
            setCustomers(Array.isArray(customerData) ? customerData : [])
            setOrders(Array.isArray(orderData) ? orderData : [])
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Could not load the admin dashboard.'
            )
        } finally {
            setLoading(false)
        }
    }, [api, appliedSearch])

    useEffect(() => {
        if (!token || user?.role !== 'admin') {
            logout()
            navigate('/admin/login', { replace: true })
            return
        }

        void loadDashboard()
    }, [token, user?.role, navigate, loadDashboard])

    function handleLogout() {
        logout()
        navigate('/admin/login', { replace: true })
    }

    function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setAppliedSearch(searchTerm.trim())
        setTab('orders')
        setNotice('')
        setError('')
    }

    function clearSearch() {
        setSearchTerm('')
        setAppliedSearch('')
        setNotice('')
        setError('')
    }

    async function updateOrderStatus(
        orderId: number,
        changes: {
            status?: OrderStatus
            payment_status?: PaymentStatus
        }
    ) {
        setError('')
        setNotice('')
        setUpdatingOrderId(orderId)

        try {
            const data = await api(`/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                body: JSON.stringify(changes),
            })

            const updatedOrder = data.order as {
                id: number
                order_number: string
                status: OrderStatus
                payment_status: PaymentStatus
            }

            setOrders(previous =>
                previous.map(order =>
                    order.id === orderId
                        ? {
                              ...order,
                              status: updatedOrder.status,
                              payment_status: updatedOrder.payment_status,
                          }
                        : order
                )
            )

            setNotice(
                `Order ${updatedOrder.order_number} updated successfully.`
            )
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Could not update the order.'
            )
        } finally {
            setUpdatingOrderId(null)
        }
    }

    const money = (
        value: number | string | null | undefined
    ) =>
        new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
        }).format(Number(value) || 0)

    const navItems: { id: Tab; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'products', label: 'Products' },
        { id: 'customers', label: 'Customers' },
        { id: 'orders', label: 'Orders' },
    ]

    const recentOrders = orders.slice(0, 5)

    // Get unique categories from the existing products
    const productCategories = Array.from(
        new Set(
            products.map(
                product =>
                    product.category_display_name?.trim() ||
                    'Uncategorized'
            )
        )
    ).sort((a, b) => a.localeCompare(b))

    // Show all products by default, or filter by selected category
    const filteredProducts =
        selectedProductCategory === 'all'
            ? products
            : products.filter(
                  product =>
                      (product.category_display_name?.trim() ||
                          'Uncategorized') === selectedProductCategory
              )

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-950 p-6 text-white md:flex">
                <div className="mb-10">
                    <p className="text-2xl font-black tracking-tight">
                        Carry<span className="text-emerald-400">Craft</span>
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                        Administration
                    </p>
                </div>

                <nav className="space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                setTab(item.id)
                                setError('')
                                setNotice('')
                            }}
                            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                                tab === item.id
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto border-t border-slate-800 pt-5">
                    <p className="truncate text-sm font-semibold">
                        {user?.full_name || 'Administrator'}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-400">
                        {user?.email}
                    </p>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-4 w-full rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="md:ml-64">
                <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
                    <div>
                        <p className="text-sm text-slate-500">
                            CarryCraft / Admin
                        </p>

                        <h1 className="mt-1 text-2xl font-bold">
                            {navItems.find(item => item.id === tab)?.label}
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadDashboard()}
                        disabled={loading}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Refresh data'}
                    </button>

                    {/* Mobile navigation */}
                    <div className="flex w-full gap-2 overflow-x-auto md:hidden">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTab(item.id)}
                                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                                    tab === item.id
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="whitespace-nowrap rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                        >
                            Sign out
                        </button>
                    </div>
                </header>

                <div className="space-y-6 p-5 sm:p-8">
                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    {notice && (
                        <div
                            role="status"
                            className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                        >
                            <span>{notice}</span>

                            <button
                                type="button"
                                onClick={() => setNotice('')}
                                aria-label="Close notification"
                                className="shrink-0 rounded p-1 text-green-700 hover:bg-green-100 hover:text-green-900"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Overview */}
                    {tab === 'overview' && (
                        <>
                            <section>
                                <h2 className="text-lg font-bold">
                                    Store overview
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Manage products, customers, and orders
                                    from one place.
                                </p>
                            </section>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {[
                                    {
                                        label: 'Total products',
                                        value: summary?.products,
                                    },
                                    {
                                        label: 'Customers',
                                        value: summary?.customers,
                                    },
                                    {
                                        label: 'Total orders',
                                        value: orders.length,
                                    },
                                ].map(card => (
                                    <section
                                        key={card.label}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <p className="text-sm text-slate-500">
                                            {card.label}
                                        </p>

                                        <p className="mt-3 text-3xl font-black">
                                            {card.value ?? '—'}
                                        </p>
                                    </section>
                                ))}
                            </div>

                            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                                <h2 className="font-bold">Quick actions</h2>

                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTab('products')}
                                        className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                                    >
                                        Manage products
                                    </button>

                                    <button
    type="button"
    onClick={() => navigate('/admin/erp-import')}
    className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
>
    Import From Excel
</button>

                                    <button
                                        type="button"
                                        onClick={() => setTab('customers')}
                                        className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                                    >
                                        View customers
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTab('orders')}
                                        className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                        Manage orders
                                    </button>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
                                    <div>
                                        <h2 className="font-bold">
                                            Recent orders
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            The latest orders placed in your
                                            store.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setTab('orders')}
                                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                                    >
                                        View all orders →
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-5 py-4">
                                                    Order
                                                </th>
                                                <th className="px-5 py-4">
                                                    Customer
                                                </th>
                                                <th className="px-5 py-4">
                                                    Total
                                                </th>
                                                <th className="px-5 py-4">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {recentOrders.map(order => (
                                                <tr key={order.id}>
                                                    <td className="px-5 py-4 font-semibold">
                                                        {order.order_number}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {order.customer_name}

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {order.customer_email}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4 font-semibold">
                                                        {money(order.total_amount)}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(order.status)}`}
                                                        >
                                                            {formatStatus(order.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}

                                            {!recentOrders.length && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="px-5 py-10 text-center text-slate-500"
                                                    >
                                                        No orders found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    )}

                    {/* Products */}
                    {tab === 'products' && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                                <div>
                                    <h2 className="text-lg font-bold">
                                        Product Management
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Add new bags or manage existing
                                        products.
                                    </p>
                                </div>

                                {/* Product category filter */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <label
                                        htmlFor="admin-product-category"
                                        className="text-sm font-medium text-slate-600"
                                    >
                                        Filter category
                                    </label>

                                    <select
                                        id="admin-product-category"
                                        value={selectedProductCategory}
                                        onChange={event =>
                                            setSelectedProductCategory(
                                                event.target.value
                                            )
                                        }
                                        className="min-w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                                    >
                                        <option value="all">
                                            All categories
                                        </option>

                                        {productCategories.map(category => (
                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {category}
                                            </option>
                                        ))}
                                    </select>

                                    <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium">
                                        {filteredProducts.length} of{' '}
                                        {products.length} products
                                    </span>
                                </div>
                            </div>

                            <div className="p-5">
                                <AdminProductManager
                                    products={filteredProducts}
                                    onChanged={() => void loadDashboard()}
                                />
                            </div>
                        </section>
                    )}

                    {/* Customers */}
                    {tab === 'customers' && (
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="border-b border-slate-200 p-5">
                                <h2 className="font-bold">
                                    Registered customers
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    View the customers registered with
                                    CarryCraft.
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">
                                                Customer
                                            </th>
                                            <th className="px-5 py-4">
                                                Email
                                            </th>
                                            <th className="px-5 py-4">
                                                Phone
                                            </th>
                                            <th className="px-5 py-4">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {customers.map(customer => (
                                            <tr
                                                key={customer.id}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold">
                                                        {customer.full_name}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        ID {customer.id}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    {customer.email}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {customer.phone_number || '—'}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSearchTerm(
                                                                customer.email
                                                            )
                                                            setAppliedSearch(
                                                                customer.email
                                                            )
                                                            setTab('orders')
                                                        }}
                                                        className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                                                    >
                                                        View orders
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}

                                        {!customers.length && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-5 py-10 text-center text-slate-500"
                                                >
                                                    No customers found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Orders */}
                    {tab === 'orders' && (
                        <section className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Orders
                                    </h2>

                                    <p className="text-sm text-gray-500">
                                        Manage customer orders and payment
                                        status.
                                    </p>
                                </div>

                                <form
                                    onSubmit={handleSearch}
                                    className="flex gap-2"
                                >
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={event =>
                                            setSearchTerm(event.target.value)
                                        }
                                        placeholder="Search order or customer..."
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600 sm:w-64"
                                    />

                                    <button
                                        type="submit"
                                        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
                                    >
                                        Search
                                    </button>

                                    {appliedSearch && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </form>
                            </div>

                            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                <table className="w-full min-w-[950px] text-left text-sm">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3">
                                                Order
                                            </th>
                                            <th className="px-4 py-3">
                                                Customer
                                            </th>
                                            <th className="px-4 py-3">
                                                Date
                                            </th>
                                            <th className="px-4 py-3">
                                                Total
                                            </th>
                                            <th className="px-4 py-3">
                                                Order Status
                                            </th>
                                            <th className="px-4 py-3">
                                                Payment
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {orders.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-4 py-10 text-center text-gray-500"
                                                >
                                                    No orders found.
                                                </td>
                                            </tr>
                                        ) : (
                                            orders.map(order => (
                                                <tr
                                                    key={order.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                                        {order.order_number ||
                                                            `#${order.id}`}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-gray-800">
                                                            {order.customer_name}
                                                        </div>

                                                        <div className="text-xs text-gray-500">
                                                            {order.customer_email}
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                                        {order.created_at
                                                            ? new Date(
                                                                  order.created_at
                                                              ).toLocaleDateString()
                                                            : '—'}
                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                                        €
                                                        {Number(
                                                            order.total_amount || 0
                                                        ).toFixed(2)}
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={order.status}
                                                            disabled={
                                                                updatingOrderId ===
                                                                order.id
                                                            }
                                                            onChange={event =>
                                                                void updateOrderStatus(
                                                                    order.id,
                                                                    {
                                                                        status: event
                                                                            .target
                                                                            .value as OrderStatus,
                                                                    }
                                                                )
                                                            }
                                                            className="w-36 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-green-600 disabled:opacity-50"
                                                        >
                                                            <option value="pending">
                                                                Pending
                                                            </option>
                                                            <option value="confirmed">
                                                                Confirmed
                                                            </option>
                                                            <option value="processing">
                                                                Processing
                                                            </option>
                                                            <option value="shipped">
                                                                Shipped
                                                            </option>
                                                            <option value="delivered">
                                                                Delivered
                                                            </option>
                                                            <option value="cancelled">
                                                                Cancelled
                                                            </option>
                                                        </select>
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={
                                                                order.payment_status
                                                            }
                                                            disabled={
                                                                updatingOrderId ===
                                                                order.id
                                                            }
                                                            onChange={event =>
                                                                void updateOrderStatus(
                                                                    order.id,
                                                                    {
                                                                        payment_status:
                                                                            event
                                                                                .target
                                                                                .value as PaymentStatus,
                                                                    }
                                                                )
                                                            }
                                                            className="w-28 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-green-600 disabled:opacity-50"
                                                        >
                                                            <option value="pending">
                                                                Pending
                                                            </option>
                                                            <option value="paid">
                                                                Paid
                                                            </option>
                                                            <option value="failed">
                                                                Failed
                                                            </option>
                                                            <option value="refunded">
                                                                Refunded
                                                            </option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <p className="text-xs text-gray-500">
                                Showing {orders.length} order
                                {orders.length !== 1 ? 's' : ''}. Changes to
                                status are saved automatically.
                            </p>
                        </section>
                    )}
                </div>
            </main>
        </div>
    )
}