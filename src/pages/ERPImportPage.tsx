
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

type ImportResult = {
  message?: string
  file?: string
  totalRows?: number
  inserted?: number
  updated?: number
  error?: string
  missingColumns?: string[]
}

export default function ERPImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null)
    setResult(null)
    setError('')
  }

  const handleImport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResult(null)
    setError('')

    if (!file) {
      setError('Please select an Excel file first.')
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!['xlsx', 'xls'].includes(extension ?? '')) {
      setError('Please select an Excel file (.xlsx or .xls).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('The file must be 5 MB or smaller.')
      return
    }

    const token = localStorage.getItem('shop_token')

    if (!token) {
      setError('Admin session not found. Please log in again.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)

    try {
      const configuredApiUrl = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '')

// Avoid adding /api twice if the environment variable already includes it.
const apiBaseUrl = configuredApiUrl.endsWith('/api')
  ? configuredApiUrl
  : `${configuredApiUrl}/api`

const response = await fetch(
  `${apiBaseUrl}/admin/erp-import`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      )

      const data = (await response.json()) as ImportResult

      if (!response.ok) {
        const details = [
          data.message || 'The ERP import failed.',
          data.missingColumns?.length
            ? `Missing columns: ${data.missingColumns.join(', ')}`
            : '',
          data.error || '',
        ]
          .filter(Boolean)
          .join(' ')

        throw new Error(details)
      }

      setResult(data)
      setFile(null)

      const input = document.getElementById(
        'erp-excel-file',
      ) as HTMLInputElement | null

      if (input) input.value = ''
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to contact the CarryCraft server.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/admin/dashboard"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          ← Back to Admin Dashboard
        </Link>

        <header className="mb-8 mt-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            CarryCraft Admin
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            ERP Product Import
          </h1>
          <p className="mt-3 text-gray-600">
            Upload the Excel file exported from the Mini-ERP to insert new
            products and update existing ERP-managed products.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleImport} className="space-y-6">
            <div>
              <label
                htmlFor="erp-excel-file"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Select ERP Excel file
              </label>

              <input
                id="erp-excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                className="block w-full rounded-lg border border-gray-300 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-60"
              />

              <p className="mt-2 text-xs text-gray-500">
                Excel files only (.xlsx or .xls), maximum size 5 MB.
              </p>
            </div>

            {file && (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold">{file.name}</p>
                <p className="mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              <p className="font-semibold">Before importing</p>
              <p className="mt-1">
                Export the latest product information from the Mini-ERP.
                Existing products with matching ERP IDs will be updated;
                new ERP IDs will create new products.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                <p className="font-semibold">Import failed</p>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div
                role="status"
                className="rounded-lg border border-green-200 bg-green-50 p-5 text-sm text-green-900"
              >
                <p className="text-base font-bold">
                  Import completed successfully
                </p>
                {result.file && (
                  <p className="mt-1">File: {result.file}</p>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-gray-500">Rows processed</p>
                    <p className="mt-1 text-2xl font-bold">
                      {result.totalRows ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-gray-500">New products</p>
                    <p className="mt-1 text-2xl font-bold">
                      {result.inserted ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <p className="text-gray-500">Updated products</p>
                    <p className="mt-1 text-2xl font-bold">
                      {result.updated ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? 'Importing products…' : 'Import ERP Products'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
