"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/auth-api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, Smartphone, Key, Mail } from "lucide-react";

export default function TwoFactorPage() {
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [twoFactorMethod, setTwoFactorMethod] = useState<"app" | "email">(
    "app"
  );
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const emailSentRef = useRef(false);
  const {
    twoFactorChallenge,
    emailTwoFactorChallenge,
    isAuthenticated,
    loading,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("two_factor_email");
    const storedMethod = sessionStorage.getItem("two_factor_method") as
      | "app"
      | "email";

    if (storedEmail) {
      setEmail(storedEmail);
    }

    if (storedMethod) {
      setTwoFactorMethod(storedMethod);

      if (storedMethod === "email" && storedEmail && !emailSentRef.current) {
        emailSentRef.current = true;
        sendEmailCode(storedEmail);
      }
    }
  }, []);

  const sendEmailCode = async (emailAddress: string) => {
    try {
      await authApi.sendEmailTwoFactorCode(emailAddress);
      setEmailCodeSent(true);
    } catch (error) {
      console.error("Failed to send email code:", error);
      setError("認証コードの送信に失敗しました。");
    }
  };

  const handleSubmit = async (e: React.FormEvent, useBackupCode = false) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const authCode = useBackupCode ? backupCode : code;

    if (!authCode || authCode.length < 6) {
      setError("6桁のコードを入力してください。");
      setIsLoading(false);
      return;
    }

    if (!email) {
      setError("セッションが無効です。ログインページからやり直してください。");
      setIsLoading(false);
      return;
    }

    console.log("Two-factor challenge data:", {
      email: email,
      code: authCode,
      method: twoFactorMethod,
      codeLength: authCode.length,
      emailFromStorage: sessionStorage.getItem("two_factor_email"),
      methodFromStorage: sessionStorage.getItem("two_factor_method"),
    });

    try {
      if (twoFactorMethod === "email") {
        await emailTwoFactorChallenge(email, authCode);
      } else {
        await twoFactorChallenge({
          email: email,
          code: authCode,
        });
      }

      sessionStorage.removeItem("two_factor_email");
      sessionStorage.removeItem("two_factor_method");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Two-factor authentication error:", err);
      console.error("Full error object:", JSON.stringify(err, null, 2));
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.response?.data?.message,
        url: err.config?.url,
        method: err.config?.method,
      });

      let errorMessage = "認証に失敗しました。";

      if (err.response?.status === 422) {
        errorMessage = "認証コードが正しくありません。";
      } else if (err.response?.status === 429) {
        errorMessage =
          "試行回数が上限に達しました。しばらく時間をおいて再度お試しください。";
      } else if (err.response?.status === 404) {
        errorMessage =
          "ユーザーが見つかりません。ログインページからやり直してください。";
      } else {
        errorMessage = err.response?.data?.message || "認証に失敗しました。";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    sessionStorage.removeItem("two_factor_email");
    sessionStorage.removeItem("two_factor_method");
    router.push("/login");
  };

  const handleResendEmailCode = async () => {
    if (!email) return;

    setError("");
    try {
      await sendEmailCode(email);
      setError("");
      setError("認証コードを再送信しました。");
      setTimeout(() => setError(""), 3000);
    } catch (error) {
      setError("認証コードの再送信に失敗しました。");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">読み込み中...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBackToLogin}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl font-semibold">
                二段階認証
              </CardTitle>
            </div>
          </div>
          <CardDescription>
            セキュリティのため、追加の認証が必要です
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {twoFactorMethod === "email" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">メール認証</p>
                  <p className="text-sm text-blue-700">
                    {emailCodeSent
                      ? `${email} に認証コードを送信しました`
                      : "認証コードを送信中..."}
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => handleSubmit(e, false)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email-code">メール認証コード</Label>
                  <Input
                    id="email-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-widest"
                    required
                  />
                  <p className="text-sm text-slate-600">
                    メールに送信された6桁のコードを入力してください
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || code.length !== 6}
                >
                  {isLoading ? "認証中..." : "ログイン"}
                </Button>
              </form>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={handleResendEmailCode}
                  className="text-sm"
                >
                  認証コードを再送信
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="authenticator" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="authenticator"
                  className="flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4" />
                  認証アプリ
                </TabsTrigger>
                <TabsTrigger value="backup" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  バックアップ
                </TabsTrigger>
              </TabsList>

              <TabsContent value="authenticator" className="space-y-4">
                <form
                  onSubmit={(e) => handleSubmit(e, false)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="code">認証アプリのコード</Label>
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="123456"
                      maxLength={6}
                      className="text-center text-lg font-mono tracking-widest"
                      required
                    />
                    <p className="text-sm text-slate-600">
                      認証アプリに表示される6桁のコードを入力してください
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || code.length !== 6}
                  >
                    {isLoading ? "認証中..." : "ログイン"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="backup" className="space-y-4">
                <form
                  onSubmit={(e) => handleSubmit(e, true)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="backup-code">バックアップコード</Label>
                    <Input
                      id="backup-code"
                      type="text"
                      value={backupCode}
                      onChange={(e) =>
                        setBackupCode(e.target.value.replace(/\s/g, ""))
                      }
                      placeholder="xxxxxxxxxx"
                      maxLength={10}
                      className="text-center text-lg font-mono tracking-widest"
                      required
                    />
                    <p className="text-sm text-slate-600">
                      二段階認証設定時に保存したバックアップコードを入力してください
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || backupCode.length < 6}
                  >
                    {isLoading ? "認証中..." : "バックアップコードでログイン"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={handleBackToLogin}
              className="text-sm"
            >
              ログインページに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
