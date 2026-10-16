import {AdminProductManager} from './uploader_deploader/AdminProductManager'
import { useCallback, useEffect, useState } from 'react'
    import { useNavigate } from 'react-router-dom'
    import { logout } from '../lib/auth'

    const API_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

    type Tab = 'overview' | 'products' | 'customers' | 'carts'

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

    interface CartItem {
        cart_id: number
        product_id: number
        name: string
        brand: string | null
        quantity: number
        price: number
        line_total: number
    }

    interface CartData {
        customer: Customer
        items: CartItem[]
        item_count: number
        total: number
    }

    interface Summary {
        products: number
        customers: number
        carts: number
        cart_items: number
    }

    export default function AdminDashboard() {
        const navigate = useNavigate()
        const [tab, setTab] = useState<Tab>('overview')
        const [products, setProducts] = useState<Product[]>([])
        const [customers, setCustomers] = useState<Customer[]>([])
        const [summary, setSummary] = useState<Summary | null>(null)
        const [cart, setCart] = useState<CartData | null>(null)
        const [selectedCustomer, setSelectedCustomer] = useState('')
        const [loading, setLoading] = useState(false)
        const [error, setError] = useState('')
        const [notice, setNotice] = useState('')

        const token = localStorage.getItem('shop_token')
        const user = JSON.parse(localStorage.getItem('shop_user') || 'null')

        const api = useCallback(async (path: string) => {
            const currentToken = localStorage.getItem('shop_token')

            if (!currentToken) {
                throw new Error('Your session has expired. Please log in again.')
            }

            const response = await fetch(`${API_URL}${path}`, {
                headers: {
                    Authorization: `Bearer ${currentToken}`,
                },
            })

            const data = await response.json().catch(() => ({}))

            if (response.status === 401 || response.status === 403) {
                logout()
                navigate('/admin/login', { replace: true })
                throw new Error(data.message || 'Admin access denied.')
            }

            if (!response.ok) {
                throw new Error(data.message || 'Request failed.')
            }

            return data
        }, [navigate])

        const loadDashboard = useCallback(async () => {
            setLoading(true)
            setError('')

            try {
                const [summaryData, productData, customerData] = await Promise.all([
                    api('/admin/summary'),
                    api('/admin/products'),
                    api('/admin/customers'),
                ])

                setSummary(summaryData)
                setProducts(productData)
                setCustomers(customerData)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not load dashboard.')
            } finally {
                setLoading(false)
            }
        }, [api])

        useEffect(() => {
            if (!token || user?.role !== 'admin') {
                logout()
                navigate('/admin/login', { replace: true })
                return
            }

            void loadDashboard()
        }, [token, user?.role, navigate, loadDashboard])

        async function viewCart(customerId: string) {
            setSelectedCustomer(customerId)
            setCart(null)
            setError('')
            setNotice('')
            setLoading(true)

            try {
                const data = await api(`/admin/customers/${customerId}/cart`)
                setCart(data)
                setTab('carts')
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not load cart.')
            } finally {
                setLoading(false)
            }
        }

        function handleLogout() {
            logout()
            navigate('/admin/login', { replace: true })
        }

        const money = (value: number | string) =>
            new Intl.NumberFormat('en-DE', {
                style: 'currency',
                currency: 'EUR',
            }).format(Number(value) || 0)

        const navItems: { id: Tab; label: string }[] = [
            { id: 'overview', label: 'Overview' },
            { id: 'products', label: 'Products' },
            { id: 'customers', label: 'Customers' },
            { id: 'carts', label: 'Customer carts' },
        ]

        return (
            <div className="min-h-screen bg-slate-100 text-slate-900">
                <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-950 p-6 text-white md:flex">
                    <div className="mb-10">
                        <p className="text-2xl font-black tracking-tight">
                            Carry<span className="text-emerald-400">Craft</span>
                        </p>
                        <p className="mt-1 text-sm text-slate-400">Administration</p>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map(item => (
                            <button
                                key={item.id}
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
                            onClick={handleLogout}
                            className="mt-4 w-full rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
                        >
                            Sign out
                        </button>
                    </div>
                </aside>

                <main className="md:ml-64">
                    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
                        <div>
                            <p className="text-sm text-slate-500">CarryCraft / Admin</p>
                            <h1 className="mt-1 text-2xl font-bold">
                                {navItems.find(item => item.id === tab)?.label}
                            </h1>
                        </div>

                        <button
                            onClick={() => void loadDashboard()}
                            disabled={loading}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Refresh data'}
                        </button>

                        <div className="flex w-full gap-2 overflow-x-auto md:hidden">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
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
                                onClick={handleLogout}
                                className="whitespace-nowrap rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                            >
                                Sign out
                            </button>
                        </div>
                    </header>

                    <div className="space-y-6 p-5 sm:p-8">
                        {error && (
                            <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {notice && (
                            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                                {notice}
                            </div>
                        )}

                        {tab === 'overview' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold">Store overview</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        A quick look at your products and customers.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {[
                                        { label: 'Total products', value: summary?.products },
                                        { label: 'Customers', value: summary?.customers },
                                        { label: 'Carts', value: summary?.carts },
                                        { label: 'Items in carts', value: summary?.cart_items },
                                    ].map(card => (
                                        <section key={card.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                            <p className="text-sm text-slate-500">{card.label}</p>
                                            <p className="mt-3 text-3xl font-black">
                                                {card.value ?? '—'}
                                            </p>
                                        </section>
                                    ))}
                                </div>

                                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                                    <h2 className="font-bold">Quick actions</h2>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <button onClick={() => setTab('products')} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                                            Manage products
                                        </button>
                                        <button onClick={() => setTab('customers')} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold">
                                            View customers
                                        </button>
                                    </div>
                                </section>
                            </>
                        )}
                        {tab === 'products' && (
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                                    <div>
                                        <h2 className="text-lg font-bold">Product Management</h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Add new bags or manage existing products.
                                        </p>
                                    </div>

                                    <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium">
                {products.length} products
            </span>
                                </div>

                                <div className="p-5">
                                    <AdminProductManager
                                        products={products}
                                        onChanged={() => void loadDashboard()}
                                    />
                                </div>
                            </section>
                        )}

                        {tab === 'customers' && (
                            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                <div className="border-b border-slate-200 p-5">
                                    <h2 className="font-bold">Registered customers</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Select a customer to inspect their shopping cart.
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">Customer</th>
                                            <th className="px-5 py-4">Email</th>
                                            <th className="px-5 py-4">Phone</th>
                                            <th className="px-5 py-4">Action</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                        {customers.map(customer => (
                                            <tr key={customer.id} className="hover:bg-slate-50">
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold">{customer.full_name}</p>
                                                    <p className="mt-1 text-xs text-slate-500">ID {customer.id}</p>
                                                </td>
                                                <td className="px-5 py-4">{customer.email}</td>
                                                <td className="px-5 py-4">{customer.phone_number || '—'}</td>
                                                <td className="px-5 py-4">
                                                    <button
                                                        onClick={() => void viewCart(String(customer.id))}
                                                        className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                                                    >
                                                        View cart
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {!customers.length && (
                                            <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">No customers found.</td></tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {tab === 'carts' && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                                <h2 className="font-bold">Customer shopping cart</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Choose a customer to load their cart.
                                </p>

                                <select
                                    value={selectedCustomer}
                                    onChange={event => void viewCart(event.target.value)}
                                    className="mt-4 w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 py-3"
                                >
                                    <option value="">Select a customer</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>
                                            {customer.full_name} — {customer.email}
                                        </option>
                                    ))}
                                </select>

                                {cart && (
                                    <>
                                        <div className="mt-6 rounded-xl bg-slate-50 p-4">
                                            <p className="font-semibold">{cart.customer.full_name}</p>
                                            <p className="mt-1 text-sm text-slate-500">{cart.customer.email}</p>
                                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <p className="text-sm text-slate-500">Total quantity</p>
                                                    <p className="text-xl font-bold">{cart.item_count}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500">Cart total</p>
                                                    <p className="text-xl font-bold">{money(cart.total)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                                <tr>
                                                    <th className="px-4 py-3">Product</th>
                                                    <th className="px-4 py-3">Quantity</th>
                                                    <th className="px-4 py-3">Unit price</th>
                                                    <th className="px-4 py-3">Subtotal</th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                {cart.items.map((item, index) => (
                                                    <tr key={`${item.cart_id}-${item.product_id}-${index}`}>
                                                        <td className="px-4 py-4">
                                                            <p className="font-semibold">{item.name}</p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {item.brand || 'No brand'} · Product {item.product_id}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-4">{item.quantity}</td>
                                                        <td className="px-4 py-4">{money(item.price)}</td>
                                                        <td className="px-4 py-4 font-semibold">{money(item.line_total)}</td>
                                                    </tr>
                                                ))}
                                                {!cart.items.length && (
                                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">This customer has an empty cart.</td></tr>
                                                )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </section>
                        )}
                    </div>
                </main>
            </div>
        )
    }
