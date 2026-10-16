
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export type UserRole = 'customer' | 'admin'

export interface AuthUser {
  id: number
  email: string
  full_name: string
  role: UserRole
  phone_number?: string
}

interface AuthResponse {
  message: string
  token: string
  user: AuthUser
}

async function requestAuth(
  endpoint: string,
  payload: Record<string, string>
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong.')
  }

  return data as AuthResponse
}

export async function customerSignup(payload: {
  email: string
  full_name: string
  phone_number: string
  password: string
  confirmPassword: string
}) {
  const data = await requestAuth('signup', payload)
  saveSession(data)
  console.log(data)
  return data
}

export async function customerLogin(
  email: string,
  password: string
) {
  const data = await requestAuth('customer/login', {
    email,
    password,
  })
  console.log(data)
  saveSession(data)
  return data
}

export async function adminLogin(
  email: string,
  password: string
) {
  const data = await requestAuth('admin/login', {
    email,
    password,
  })
  saveSession(data)
  console.log(data)
  return data
}

function saveSession(data: AuthResponse) {
  localStorage.setItem('shop_token', data.token)
  localStorage.setItem('shop_user', JSON.stringify(data.user))
}

export function logout() {
  localStorage.removeItem('shop_token')
  localStorage.removeItem('shop_user')
}
