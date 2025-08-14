"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">読み込み中...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください。")
      setIsLoading(false)
      return
    }

    if (!email.includes("@")) {
      setError("有効なメールアドレスを入力してください。")
      setIsLoading(false)
      return
    }

    try {
      console.log("Form submission:", { email, password: "***" })
      const result = await login(email, password)

      if (result.requiresTwoFactor) {
        sessionStorage.setItem("two_factor_email", email)
        sessionStorage.setItem("two_factor_method", result.twoFactorMethod || "app")
        router.push("/login/two-factor")
      } else {
        router.push("/dashboard")
      }
    } catch (err: any) {
      console.error("Login error:", err)

      if (err.response?.data?.two_factor) {
        sessionStorage.setItem("two_factor_email", email)
        sessionStorage.setItem("two_factor_method", err.response.data.two_factor_method || "app")
        router.push("/login/two-factor")
        return
      }

      let errorMessage = "ログインに失敗しました。"

      if (err.response?.status === 422) {
        const errors = err.response?.data?.errors
        if (errors) {
          const errorList = Object.entries(errors)
            .map(([field, messages]) => (Array.isArray(messages) ? messages.join(", ") : messages))
            .join(" | ")
          errorMessage = `入力エラー: ${errorList}`
        } else {
          errorMessage = err.response?.data?.message || "入力データに問題があります。"
        }
      } else if (err.response?.status === 401) {
        errorMessage = "メールアドレスまたはパスワードが正しくありません。"
      } else {
        errorMessage = err.response?.data?.message || "ログインに失敗しました。しばらく時間をおいて再度お試しください。"
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <CardTitle className="text-xl font-semibold">ログイン</CardTitle>
          </div>
          <CardDescription>アカウントにログインしてください</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              新規登録
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
