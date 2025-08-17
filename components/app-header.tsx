"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  LogOut,
  Home,
  FileText,
  User,
  Users,
  Heart,
} from "lucide-react";
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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("ログアウトエラー:", error);
    } finally {
      setShowLogoutDialog(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  const userInitials = user?.name?.charAt(0) || "U";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-16">
          {/* 左側 - タイトル */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-semibold text-slate-900 hover:text-slate-700 transition-colors"
            >
              {title}
            </Link>
          </div>

          {/* 中央 - ナビゲーションメニュー（絶対位置で中央固定） */}
          {showNavigation && (
            <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-1">
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
                  タイムライン
                </Button>
              </Link>
              <Link href={user?.id ? `/profile/${user.id}` : "/profile"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  プロフィール
                </Button>
              </Link>
            </nav>
          )}

          {/* 右側 - ユーザー情報/アクション */}
          <div className="ml-auto flex items-center gap-2">
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
                    <AvatarImage src={user.profile_image || undefined} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
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
                <Button variant="ghost" size="sm" onClick={handleLogoutClick}>
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

      {/* ログアウト確認ダイアログ */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ログアウトしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在のセッションを終了し、ログインページに移動します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              ログアウト
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
