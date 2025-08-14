"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, XCircle, Shield, Mail, Smartphone } from "lucide-react"
import { authApi } from "@/lib/auth-api"
import api from "@/lib/api"

interface TestResult {
  name: string
  status: "success" | "error" | "pending"
  message: string
}

export default function TestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testEmail, setTestEmail] = useState("test@example.com")

  const addResult = (name: string, status: "success" | "error", message: string) => {
    setTestResults((prev) => [...prev, { name, status, message }])
  }

  const runBasicConnectionTest = async () => {
    try {
      const response = await api.get("/test")
      addResult("基本接続テスト", "success", `API接続成功: ${response.data.message}`)
    } catch (error: any) {
      addResult("基本接続テスト", "error", `接続失敗: ${error.message}`)
    }
  }

  const runRegistrationFlowTest = async () => {
    try {
      // Step 1: メールアドレスで仮登録
      await authApi.registerWithEmail({ email: testEmail })
      addResult("メール仮登録", "success", "確認コードの送信に成功しました")

      // Step 2: 無効なコードでテスト（エラーハンドリングのテスト）
      try {
        await authApi.verifyEmailAndCompleteRegistration({
          email: testEmail,
          code: "000000",
          name: "テストユーザー",
          password: "testpassword123",
          password_confirmation: "testpassword123",
        })
        addResult("無効コードテスト", "error", "無効なコードが受け入れられました（予期しない動作）")
      } catch (error: any) {
        addResult("無効コードテスト", "success", "無効なコードが正しく拒否されました")
      }
    } catch (error: any) {
      addResult("登録フローテスト", "error", `テスト失敗: ${error.response?.data?.message || error.message}`)
    }
  }

  const runLoginFlowTest = async () => {
    try {
      // 存在しないユーザーでログインテスト
      try {
        await authApi.login({ email: "nonexistent@example.com", password: "wrongpassword" })
        addResult("ログインエラーテスト", "error", "存在しないユーザーでログインが成功しました（予期しない動作）")
      } catch (error: any) {
        addResult("ログインエラーテスト", "success", "存在しないユーザーのログインが正しく拒否されました")
      }
    } catch (error: any) {
      addResult("ログインフローテスト", "error", `テスト失敗: ${error.message}`)
    }
  }

  const runEmailVerificationTest = async () => {
    try {
      // メール認証状態確認テスト
      try {
        const result = await authApi.checkEmailVerification()
        addResult("メール認証状態確認", "success", `認証状態: ${result.verified ? "認証済み" : "未認証"}`)
      } catch (error: any) {
        addResult("メール認証状態確認", "error", `状態確認失敗: ${error.response?.data?.message || error.message}`)
      }

      // メール再送信テスト
      try {
        await authApi.resendVerificationEmail()
        addResult("認証メール再送信", "success", "認証メールの再送信に成功しました")
      } catch (error: any) {
        addResult("認証メール再送信", "error", `再送信失敗: ${error.response?.data?.message || error.message}`)
      }
    } catch (error: any) {
      addResult("メール認証テスト", "error", `テスト失敗: ${error.message}`)
    }
  }

  const runAppTwoFactorTest = async () => {
    try {
      // 認証アプリによる二段階認証有効化テスト
      try {
        const response = await authApi.enableTwoFactor()
        addResult("認証アプリ二段階認証有効化", "success", "認証アプリによる二段階認証の有効化に成功しました")

        // QRコード取得テスト
        try {
          const qrResponse = await authApi.getTwoFactorQrCode()
          addResult("QRコード取得", "success", "QRコードの取得に成功しました")
        } catch (error: any) {
          addResult("QRコード取得", "error", `QRコード取得失敗: ${error.response?.data?.message || error.message}`)
        }

        // シークレットキー取得テスト
        try {
          const secretResponse = await authApi.getTwoFactorSecret()
          addResult("シークレットキー取得", "success", `シークレットキー: ${secretResponse.secret.substring(0, 8)}...`)
        } catch (error: any) {
          addResult(
            "シークレットキー取得",
            "error",
            `シークレットキー取得失敗: ${error.response?.data?.message || error.message}`,
          )
        }

        // バックアップコード取得テスト
        try {
          const codesResponse = await authApi.getTwoFactorRecoveryCodes()
          addResult(
            "バックアップコード取得",
            "success",
            `${codesResponse.recovery_codes.length}個のバックアップコードを取得しました`,
          )
        } catch (error: any) {
          addResult(
            "バックアップコード取得",
            "error",
            `バックアップコード取得失敗: ${error.response?.data?.message || error.message}`,
          )
        }
      } catch (error: any) {
        addResult(
          "認証アプリ二段階認証有効化",
          "error",
          `有効化失敗: ${error.response?.data?.message || error.message}`,
        )
      }

      // 二段階認証無効化テスト
      try {
        await authApi.disableTwoFactor()
        addResult("認証アプリ二段階認証無効化", "success", "認証アプリによる二段階認証の無効化に成功しました")
      } catch (error: any) {
        addResult(
          "認証アプリ二段階認証無効化",
          "error",
          `無効化失敗: ${error.response?.data?.message || error.message}`,
        )
      }
    } catch (error: any) {
      addResult("認証アプリ二段階認証テスト", "error", `テスト失敗: ${error.message}`)
    }
  }

  const runEmailTwoFactorTest = async () => {
    try {
      // メール認証による二段階認証有効化テスト
      try {
        await authApi.enableEmailTwoFactor()
        addResult("メール二段階認証有効化", "success", "メール認証による二段階認証の有効化に成功しました")
      } catch (error: any) {
        addResult("メール二段階認証有効化", "error", `有効化失敗: ${error.response?.data?.message || error.message}`)
      }

      // メール認証コード送信テスト
      try {
        await authApi.sendEmailTwoFactorCode(testEmail)
        addResult("メール認証コード送信", "success", "メール認証コードの送信に成功しました")
      } catch (error: any) {
        addResult("メール認証コード送信", "error", `送信失敗: ${error.response?.data?.message || error.message}`)
      }

      // メール認証による二段階認証無効化テスト
      try {
        await authApi.disableEmailTwoFactor()
        addResult("メール二段階認証無効化", "success", "メール認証による二段階認証の無効化に成功しました")
      } catch (error: any) {
        addResult("メール二段階認証無効化", "error", `無効化失敗: ${error.response?.data?.message || error.message}`)
      }
    } catch (error: any) {
      addResult("メール二段階認証テスト", "error", `テスト失敗: ${error.message}`)
    }
  }

  const runTwoFactorTest = async () => {
    await runAppTwoFactorTest()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    await runEmailTwoFactorTest()
  }

  const runProfileUpdateTest = async () => {
    try {
      // プロフィール更新テスト
      try {
        const updatedUser = await authApi.updateProfile({
          name: "テストユーザー更新",
          email: testEmail,
        })
        addResult("プロフィール更新", "success", `プロフィール更新成功: ${updatedUser.name}`)
      } catch (error: any) {
        addResult("プロフィール更新", "error", `更新失敗: ${error.response?.data?.message || error.message}`)
      }

      // パスワード変更テスト（無効なパスワードでテスト）
      try {
        await authApi.changePassword({
          current_password: "wrongpassword",
          password: "newpassword123",
          password_confirmation: "newpassword123",
        })
        addResult("パスワード変更エラーテスト", "error", "無効なパスワードで変更が成功しました（予期しない動作）")
      } catch (error: any) {
        addResult("パスワード変更エラーテスト", "success", "無効なパスワードが正しく拒否されました")
      }
    } catch (error: any) {
      addResult("プロフィール更新テスト", "error", `テスト失敗: ${error.message}`)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    await runBasicConnectionTest()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await runRegistrationFlowTest()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await runLoginFlowTest()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await runEmailVerificationTest()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await runTwoFactorTest()
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await runProfileUpdateTest()

    setIsRunning(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <CardTitle className="text-xl font-semibold">認証システム統合テスト</CardTitle>
            </div>
            <CardDescription>Laravel APIとの接続および認証フローの動作確認を行います</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">テスト用メールアドレス</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button onClick={runAllTests} disabled={isRunning} className="col-span-2 md:col-span-1">
                {isRunning ? "テスト実行中..." : "全テスト実行"}
              </Button>
              <Button variant="outline" onClick={runBasicConnectionTest} disabled={isRunning}>
                基本接続
              </Button>
              <Button variant="outline" onClick={runRegistrationFlowTest} disabled={isRunning}>
                登録フロー
              </Button>
              <Button variant="outline" onClick={runLoginFlowTest} disabled={isRunning}>
                ログイン
              </Button>
              <Button variant="outline" onClick={runEmailVerificationTest} disabled={isRunning}>
                <Mail className="h-4 w-4 mr-1" />
                メール認証
              </Button>
              <Button variant="outline" onClick={runAppTwoFactorTest} disabled={isRunning}>
                <Smartphone className="h-4 w-4 mr-1" />
                認証アプリ
              </Button>
              <Button variant="outline" onClick={runEmailTwoFactorTest} disabled={isRunning}>
                <Shield className="h-4 w-4 mr-1" />
                メール2FA
              </Button>
              <Button variant="outline" onClick={runProfileUpdateTest} disabled={isRunning}>
                プロフィール
              </Button>
              <Button variant="outline" onClick={clearResults}>
                結果クリア
              </Button>
            </div>
          </CardContent>
        </Card>

        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">テスト結果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <Alert key={index} variant={result.status === "error" ? "destructive" : "default"}>
                    <div className="flex items-center gap-2">
                      {result.status === "success" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{result.name}</div>
                        <AlertDescription className="mt-1">{result.message}</AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Laravel側で実装が必要なAPIエンドポイント</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">メール認証による二段階認証</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>POST /api/user/email-two-factor-authentication - メール二段階認証有効化</li>
                  <li>DELETE /api/user/email-two-factor-authentication - メール二段階認証無効化</li>
                  <li>POST /api/email-two-factor-code - ログイン時メール認証コード送信</li>
                  <li>POST /api/email-two-factor-challenge - メール認証コード検証</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">ログイン時の認証方法分岐</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>ログインAPIで二段階認証が必要な場合、two_factor_method（"app" | "email"）を返す</li>
                  <li>認証アプリの場合：既存の /api/two-factor-challenge を使用</li>
                  <li>メール認証の場合：/api/email-two-factor-challenge を使用</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Userモデルの更新</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>email_two_factor_enabled カラムを追加（boolean）</li>
                  <li>二段階認証の無効化時は両方の認証方法をクリア</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
