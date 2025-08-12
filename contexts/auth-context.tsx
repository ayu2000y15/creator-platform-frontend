"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authApi, type User, type TwoFactorChallengeData } from "@/lib/auth-api"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ requiresTwoFactor?: boolean }>
  register: (name: string, email: string, password: string) => Promise<void>
  registerWithEmail: (email: string) => Promise<void>
  verifyEmailAndCompleteRegistration: (email: string, code: string, name: string, password: string) => Promise<void>
  logout: () => Promise<void>
  twoFactorChallenge: (data: TwoFactorChallengeData) => Promise<void>
  enableTwoFactor: () => Promise<any>
  disableTwoFactor: () => Promise<void>
  loading: boolean
  isAuthenticated: boolean
  requiresTwoFactor: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)

  // 初期化時にトークンからユーザー情報を取得
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token")
      if (token) {
        try {
          const userData = await authApi.getUser()
          setUser(userData)
        } catch (error) {
          localStorage.removeItem("auth_token")
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log("Login attempt:", { email, password: "***" })

      const response = await authApi.login({ email, password })

      if (response.two_factor) {
        setRequiresTwoFactor(true)
        return { requiresTwoFactor: true }
      }

      localStorage.setItem("auth_token", response.token)
      setUser(response.user)
      setRequiresTwoFactor(false)
      return {}
    } catch (error: any) {
      console.error("Login error details:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        errors: error.response?.data?.errors,
        data: error.response?.data,
      })
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.register({
        name,
        email,
        password,
        password_confirmation: password,
      })

      localStorage.setItem("auth_token", response.token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const registerWithEmail = async (email: string) => {
    try {
      await authApi.registerWithEmail({ email })
    } catch (error) {
      throw error
    }
  }

  const verifyEmailAndCompleteRegistration = async (email: string, code: string, name: string, password: string) => {
    try {
      const response = await authApi.verifyEmailAndCompleteRegistration({
        email,
        code,
        name,
        password,
        password_confirmation: password,
      })

      localStorage.setItem("auth_token", response.token)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const twoFactorChallenge = async (data: TwoFactorChallengeData) => {
    try {
      const response = await authApi.twoFactorChallenge(data)
      localStorage.setItem("auth_token", response.token)
      setUser(response.user)
      setRequiresTwoFactor(false)
    } catch (error) {
      throw error
    }
  }

  const enableTwoFactor = async () => {
    try {
      const response = await authApi.enableTwoFactor()
      // ユーザー情報を更新
      if (user) {
        setUser({ ...user, two_factor_enabled: true })
      }
      return response
    } catch (error) {
      throw error
    }
  }

  const disableTwoFactor = async () => {
    try {
      await authApi.disableTwoFactor()
      // ユーザー情報を更新
      if (user) {
        setUser({ ...user, two_factor_enabled: false })
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // ログアウトAPIが失敗してもローカルの状態はクリア
      console.error("Logout API failed:", error)
    } finally {
      localStorage.removeItem("auth_token")
      setUser(null)
      setRequiresTwoFactor(false)
    }
  }

  const value = {
    user,
    login,
    register,
    registerWithEmail,
    verifyEmailAndCompleteRegistration,
    logout,
    twoFactorChallenge,
    enableTwoFactor,
    disableTwoFactor,
    loading,
    isAuthenticated: !!user,
    requiresTwoFactor,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
