import { toast } from "sonner"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface ApiOptions extends RequestInit {
  requiresAuth?: boolean
}

async function getSessionToken(): Promise<string | null> {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

async function request<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (requiresAuth) {
    const token = await getSessionToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(
        error.message || `HTTP ${response.status}`,
        response.status,
        error
      )
    }

    return response.json()
  } catch (error) {
    if (error instanceof ApiError) throw error
    toast.error("Terjadi kesalahan jaringan")
    throw error
  }
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.data = data
  }
}

export const api = {
  get: <T>(endpoint: string, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
}
