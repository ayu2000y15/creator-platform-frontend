"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterCompletePage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [birthday, setBirthday] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const { verifyEmailAndCompleteRegistration } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      router.push("/register");
    }
  }, [searchParams, router]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("パスワードが一致しません");
      return;
    }

    if (code.length !== 6) {
      setError("確認コードは6桁で入力してください");
      return;
    }

    setIsLoading(true);

    try {
      await verifyEmailAndCompleteRegistration(
        email,
        code,
        name,
        password,
        birthday || undefined,
        phoneNumber || undefined
      );
      router.push("/dashboard");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error && error.response
          ? (error.response as any)?.data?.message ||
            "登録に失敗しました。もう一度お試しください。"
          : "登録に失敗しました。もう一度お試しください。";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/register">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <CardTitle className="text-xl font-semibold">登録を完了</CardTitle>
          </div>
          <CardDescription>
            {email} に送信された確認コードとアカウント情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleComplete} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">確認コード</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-widest"
                required
              />
              <p className="text-xs text-slate-500">
                メールに記載された6桁のコードを入力
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">お名前</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="山田太郎"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">誕生日（任意）</Label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-slate-500">
                誕生日を入力すると、お誕生日に特別なサービスを受けられます
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">電話番号（任意）</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="090-1234-5678"
              />
              <p className="text-xs text-slate-500">
                緊急時の連絡やサポートに使用します
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上のパスワード"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirmation">パスワード確認</Label>
              <Input
                id="passwordConfirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="パスワードを再入力"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登録中..." : "アカウント作成"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
