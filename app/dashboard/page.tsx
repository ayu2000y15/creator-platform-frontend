"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Edit } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import AppHeader from "@/components/app-header";

export default function DashboardPage() {
  const { user, userStats, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="ダッシュボード" />

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
              <CardTitle className="text-sm font-medium">総投稿数</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats?.post_count ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総ビュー数</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats?.total_views ?? 0}
              </div>
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
              <div className="text-2xl font-bold">
                {userStats?.follower_count ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* アクションセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>新しい作品を作成</CardTitle>
              <CardDescription>新しい投稿を始めましょう</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                投稿を作成
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近の投稿</CardTitle>
              <CardDescription>最近更新された投稿一覧</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">サンプル投稿 1</p>
                  <p className="text-sm text-slate-600">2日前に更新</p>
                </div>
                <Badge variant="secondary">公開中</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">サンプル投稿 2</p>
                  <p className="text-sm text-slate-600">1週間前に更新</p>
                </div>
                <Badge variant="outline">下書き</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 固定投稿ボタン */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        onClick={() => router.push("/dashboard/post")}
      >
        <Edit className="h-6 w-6" />
      </Button>
    </div>
  );
}
