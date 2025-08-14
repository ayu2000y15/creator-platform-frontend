"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, AlertCircle } from "lucide-react"

export function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState("")

  if (!user || user.email_verified_at) {
    return null
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    setMessage("")

    try {
      await resendVerificationEmail()
      setMessage("認証メールを再送信しました。メールボックスをご確認ください。")
    } catch (error) {
      setMessage("メール送信に失敗しました。しばらく後に再試行してください。")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
      <AlertDescription className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">メールアドレスの認証が完了していません。認証メールをご確認ください。</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendEmail}
            disabled={isResending}
            className="bg-transparent flex-shrink-0 self-start sm:self-center"
          >
            {isResending ? "送信中..." : "再送信"}
          </Button>
        </div>
        {message && <div className="mt-3 text-sm text-amber-700 bg-amber-100 p-2 rounded">{message}</div>}
      </AlertDescription>
    </Alert>
  )
}
