"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const [step, setStep] = useState<"email" | "verification">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { registerWithEmail } = useAuth();
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await registerWithEmail(email);
      setStep("verification");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "メール送信に失敗しました。もう一度お試しください。";
      // 英語のエラーメッセージを日本語に変換
      const translatedMessage =
        errorMessage === "The email has already been taken."
          ? "このメールアドレスは既に登録されています。"
          : errorMessage;
      setError(translatedMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "email") {
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
              <CardTitle className="text-xl font-semibold">新規登録</CardTitle>
            </div>
            <CardDescription>
              メールアドレスを入力して登録を開始してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "送信中..." : "確認メールを送信"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              すでにアカウントをお持ちの方は{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                ログイン
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold">
            メールを確認してください
          </CardTitle>
          <CardDescription>
            {email} に確認コードを送信しました。
            <br />
            メールに記載された6桁のコードを入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setStep("email")}
              className="text-sm"
            >
              メールアドレスを変更
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() =>
                router.push(
                  `/register/complete?email=${encodeURIComponent(email)}`
                )
              }
              className="text-blue-600"
            >
              コードを入力して登録を完了する
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-600">
            メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
