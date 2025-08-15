"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, LogOut, Plus, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EmailVerificationBanner } from "@/components/email-verification-banner";

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const userInitials = user.name.slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-slate-900">
              Creator Platform
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 hover:bg-slate-100 rounded-lg p-2 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  {user.profile_image ? (
                    <AvatarImage
                      key={user.profile_image} // 表示を確実に更新するためのkey
                      src={user.profile_image}
                      alt={user.name}
                    />
                  ) : (
                    <AvatarFallback>
                      {" "}
                      {/* text-2xlを削除 */}
                      {userInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
                {/* <span className="text-sm font-medium text-slate-700">
                  {user.name}
                </span> */}
              </button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmailVerificationBanner />

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            おかえりなさい、{user.name}さん
          </h2>
          <p className="text-slate-600">今日も素晴らしい作品を作りましょう</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総作品数</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-slate-600">先月から +2</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ビュー数</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-slate-600">先月から +180</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                フォロワー数
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-slate-600">先月から +12</p>
            </CardContent>
          </Card>
        </div>

        {/* アクションセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>新しい作品を作成</CardTitle>
              <CardDescription>
                新しいプロジェクトを始めましょう
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                作品を作成
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近の作品</CardTitle>
              <CardDescription>最近更新された作品一覧</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">サンプル作品 1</p>
                  <p className="text-sm text-slate-600">2日前に更新</p>
                </div>
                <Badge variant="secondary">公開中</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">サンプル作品 2</p>
                  <p className="text-sm text-slate-600">1週間前に更新</p>
                </div>
                <Badge variant="outline">下書き</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
