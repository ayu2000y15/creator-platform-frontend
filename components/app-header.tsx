"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, Home, FileText, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AppHeaderProps {
  title?: string;
  showNavigation?: boolean;
}

export default function AppHeader({
  title = "Creator Platform",
  showNavigation = true,
}: AppHeaderProps) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

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

  const userInitials = user?.name?.slice(0, 2) || "??";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左側 - タイトル/ナビゲーション */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-semibold text-slate-900 hover:text-slate-700 transition-colors"
            >
              {title}
            </Link>

            {showNavigation && (
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    ダッシュボード
                  </Button>
                </Link>
                <Link href="/posts">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    投稿
                  </Button>
                </Link>
              </nav>
            )}
          </div>

          {/* 右側 - ユーザー情報/アクション */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
            ) : user ? (
              <>
                {/* ユーザープロフィール */}
                <button
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 hover:bg-slate-100 rounded-lg p-2 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    {user.profile_image ? (
                      <AvatarImage
                        key={user.profile_image}
                        src={user.profile_image}
                        alt={user.name}
                      />
                    ) : (
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-slate-700">
                      {user.name}
                    </div>
                    {user.email_verified_at ? (
                      <div className="text-xs text-green-600">認証済み</div>
                    ) : (
                      <div className="text-xs text-orange-600">未認証</div>
                    )}
                  </div>
                </button>

                {/* アクションボタン */}
                <Button variant="ghost" size="sm" onClick={handleProfileClick}>
                  <User className="h-4 w-4" />
                  <span className="sr-only">プロフィール</span>
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">設定</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">ログアウト</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    ログイン
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">新規登録</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
