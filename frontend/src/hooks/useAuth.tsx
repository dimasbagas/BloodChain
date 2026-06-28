"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CustomUser {
  id: string
  email: string
  fullName: string
  role: string
}

interface CustomSession {
  access_token: string
}

interface AuthContextType {
  user: CustomUser | null
  session: CustomSession | null
  isLoading: boolean
  role: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null)
  const [session, setSession] = useState<CustomSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function recoverSession() {
      if (typeof window === "undefined") {
        setIsLoading(false)
        return
      }

      const token = localStorage.getItem("access_token")
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`${BASE_URL}/api/auth/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        const json = await res.json()
        if (res.ok && json.success) {
          const profileUser = json.data

          let frontendRole = "donor"
          if (profileUser.role === "PMI") {
            frontendRole = "pmi"
          } else if (profileUser.role === "HOSPITAL") {
            frontendRole = "rumah_sakit"
          } else if (profileUser.role === "ADMIN") {
            frontendRole = "admin"
          }

          setUser({
            id: profileUser.id,
            email: profileUser.email,
            fullName: profileUser.fullName,
            role: frontendRole,
          })
          setRole(frontendRole)
          setSession({ access_token: token })
        } else {
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
        }
      } catch (err) {
        console.error("Session recovery failed", err)
      } finally {
        setIsLoading(false)
      }
    }

    recoverSession()
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.message || "Email atau password salah")
        throw new Error(json.message || "Email atau password salah")
      }

      const { accessToken, refreshToken, user: loggedUser } = json.data

      localStorage.setItem("access_token", accessToken)
      localStorage.setItem("refresh_token", refreshToken)

      let frontendRole = "donor"
      if (loggedUser.role === "PMI") {
        frontendRole = "pmi"
      } else if (loggedUser.role === "HOSPITAL") {
        frontendRole = "rumah_sakit"
      } else if (loggedUser.role === "ADMIN") {
        frontendRole = "admin"
      }

      const customUser = {
        id: loggedUser.id,
        email: loggedUser.email,
        fullName: loggedUser.fullName,
        role: frontendRole,
      }

      setUser(customUser)
      setRole(frontendRole)
      setSession({ access_token: accessToken })

      toast.success("Berhasil masuk")
      router.push("/dashboard")
    },
    [router]
  )

  const register = useCallback(
    async (
      email: string,
      password: string,
      metadata?: Record<string, unknown>
    ) => {
      let backendRole = "DONOR"
      if (metadata?.role === "pmi") {
        backendRole = "PMI"
      } else if (metadata?.role === "rumah_sakit") {
        backendRole = "HOSPITAL"
      } else if (metadata?.role === "admin") {
        backendRole = "ADMIN"
      }

      let backendRhesus = "POSITIVE"
      if (metadata?.rhesus === "-") {
        backendRhesus = "NEGATIVE"
      }

      const payload = {
        email,
        password,
        fullName: (metadata?.nama as string) || "",
        role: backendRole,
        phone: (metadata?.no_hp as string) || "",
        bloodType: (metadata?.golongan_darah as string) || undefined,
        rhesus: metadata?.golongan_darah ? backendRhesus : undefined,
      }

      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || "Registrasi gagal")
        throw new Error(data.message || "Registrasi gagal")
      }

      toast.success("Registrasi berhasil, silakan masuk")
      router.push("/auth/login")
    },
    [router]
  )

  const logout = useCallback(async () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    setUser(null)
    setRole(null)
    setSession(null)
    toast.success("Berhasil keluar")
    router.push("/auth/login")
  }, [router])

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, role, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
