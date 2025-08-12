"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
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

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])

    await runBasicConnectionTest()
    await new Promise((resolve) => setTimeout(resolve, 1000)) // 1秒待機

    await runRegistrationFlowTest()
    await new Promise((resolve) => setTimeout(resolve, 1000)) // 1秒待機

    await runLoginFlowTest()

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

            <div className="flex gap-2">
              <Button onClick={runAllTests} disabled={isRunning}>
                {isRunning ? "テスト実行中..." : "全テスト実行"}
              </Button>
              <Button variant="outline" onClick={runBasicConnectionTest} disabled={isRunning}>
                基本接続テスト
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
            <CardTitle className="text-lg">テスト手順</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">1. Laravel側の準備</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Laravel Sanctumがインストール済みであること</li>
                  <li>UserモデルでHasApiTokensトレイトが使用されていること</li>
                  <li>CORS設定が正しく行われていること</li>
                  <li>メール送信設定が完了していること</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">2. 新しいAPIエンドポイントの追加</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>POST /api/register/email - メール仮登録</li>
                  <li>POST /api/register/verify - 登録完了</li>
                  <li>GET /api/test - 接続テスト用</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">3. 実際の登録フロー</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>/register でメールアドレスを入力</li>
                  <li>メールに送信された6桁のコードを確認</li>
                  <li>/register/complete でコードと詳細情報を入力</li>
                  <li>登録完了後、/dashboard にリダイレクト</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
