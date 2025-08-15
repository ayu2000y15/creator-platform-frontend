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
import {
  ArrowLeft,
  Edit,
  User,
  Shield,
  Calendar,
  Settings,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleSecuritySettings = () => {
    router.push("/profile/security");
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

  // 生年月日の表示フォーマット関数
  const formatBirthday = (birthday: string, visibility: string) => {
    if (!birthday || visibility === "hidden") return "非公開";

    const date = new Date(birthday);
    if (visibility === "month_day") {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    // visibility === 'full'
    return date.toLocaleDateString("ja-JP");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                ダッシュボードに戻る
              </Button>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              プロフィール
            </h1>
            <Button onClick={handleEditProfile}>
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* プロフィール基本情報 */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  {user.profile_image ? (
                    <AvatarImage
                      key={user.profile_image} // 表示を確実に更新するためのkey
                      src={user.profile_image}
                      alt={user.name}
                    />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {userInitials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-1">{user.name}</CardTitle>
                  {user.username && (
                    <p className="text-slate-500 text-sm mb-2">
                      @{user.username}
                    </p>
                  )}
                  <CardDescription className="text-base mb-3">
                    {user.email}
                  </CardDescription>
                  {user.bio && (
                    <p className="text-slate-700 mb-3 whitespace-pre-wrap">
                      {user.bio}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {user.two_factor_confirmed_at ||
                    user.email_two_factor_enabled ? (
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Shield className="h-3 w-3" />
                        二段階認証有効
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Shield className="h-3 w-3" />
                        二段階認証無効
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* アカウント詳細 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  基本情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    名前
                  </label>
                  <p className="text-slate-900 mt-1">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    メールアドレス
                  </label>
                  <p className="text-slate-900 mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    誕生日
                  </label>
                  <p className="text-slate-900 mt-1">
                    {formatBirthday(
                      user.birthday || "",
                      user.birthday_visibility || "hidden"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    電話番号
                  </label>
                  <p className="text-slate-900 mt-1">
                    {user.phone_number || "未設定"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    ユーザーID
                  </label>
                  <p className="text-slate-900 mt-1">#{user.id}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    セキュリティ
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSecuritySettings}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    設定
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    二段階認証
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {user.two_factor_confirmed_at ||
                    user.email_two_factor_enabled ? (
                      <Badge variant="secondary">有効</Badge>
                    ) : (
                      <Badge variant="outline">無効</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">
                    メール認証
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {user.email_verified_at ? (
                      <Badge variant="secondary">認証済み</Badge>
                    ) : (
                      <Badge variant="destructive">未認証</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* アカウント統計 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                アカウント情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">12</div>
                  <p className="text-sm text-slate-600">作品数</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">1,234</div>
                  <p className="text-sm text-slate-600">総ビュー数</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">89</div>
                  <p className="text-sm text-slate-600">フォロワー数</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
