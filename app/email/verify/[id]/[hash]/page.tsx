"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function EmailVerifyPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { verifyEmail } = useAuth()

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verify = async () => {
      try {
        const id = params.id as string
        const hash = params.hash as string
        const signature = searchParams.get("signature") || ""

        await verifyEmail(id, hash, signature)
        setStatus("success")
        setMessage("メールアドレスの認証が完了しました。")

        // 3秒後にダッシュボードにリダイレクト
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      } catch (error) {
        setStatus("error")
        setMessage("メール認証に失敗しました。リンクが無効か期限切れの可能性があります。")
      }
    }

    verify()
  }, [params, searchParams, verifyEmail, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === "verifying" && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === "success" && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === "error" && <XCircle className="h-6 w-6 text-red-600" />}
            メール認証
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>

          {status === "success" && (
            <p className="text-sm text-gray-500">3秒後にダッシュボードにリダイレクトします...</p>
          )}

          {status === "error" && (
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              ダッシュボードに戻る
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
