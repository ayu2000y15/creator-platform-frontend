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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Settings,
  LogOut,
  Home,
  FileText,
  User,
  Users,
  Heart,
  Menu,
  X,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const navigationItems = [
    {
      href: "/dashboard",
      icon: Home,
      label: "ダッシュボード",
    },
    {
      href: "/posts",
      icon: FileText,
      label: "タイムライン",
    },
    {
      href: user?.id ? `/profile/${user.id}` : "/profile",
      icon: User,
      label: "プロフィール",
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-16">
          {/* 左側 - メニューボタン（モバイル）とタイトル */}
          <div className="flex items-center space-x-3">
            {/* モバイルメニューボタン */}
            {showNavigation && (
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden p-2">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">メニューを開く</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader className="border-b pb-4 mb-4">
                    <SheetTitle className="text-left">{title}</SheetTitle>
                  </SheetHeader>

                  {/* ユーザー情報（モバイルサイドバー用） */}
                  {user && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profile_image || undefined} />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {user.email}
                        </div>
                        {user.email_verified_at ? (
                          <div className="text-xs text-green-600">認証済み</div>
                        ) : (
                          <div className="text-xs text-orange-600">未認証</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ナビゲーションメニュー */}
                  <nav className="space-y-2">
                    {navigationItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 text-left"
                          >
                            <IconComponent className="h-5 w-5 mr-3" />
                            {item.label}
                          </Button>
                        </Link>
                      );
                    })}
                  </nav>

                  {/* アクションボタン（モバイルサイドバー用） */}
                  {user && (
                    <div className="mt-6 pt-4 border-t space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                        onClick={() => {
                          setSidebarOpen(false);
                          handleProfileClick();
                        }}
                      >
                        <User className="h-5 w-5 mr-3" />
                        プロフィール
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12"
                      >
                        <Settings className="h-5 w-5 mr-3" />
                        設定
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-12 text-red-600 hover:text-red-700"
                        onClick={() => {
                          setSidebarOpen(false);
                          handleLogoutClick();
                        }}
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        ログアウト
                      </Button>
                    </div>
                  )}

                  {/* 未ログイン時のアクション */}
                  {!user && (
                    <div className="mt-6 pt-4 border-t space-y-2">
                      <Link href="/login" onClick={() => setSidebarOpen(false)}>
                        <Button className="w-full">ログイン</Button>
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Button variant="outline" className="w-full">
                          新規登録
                        </Button>
                      </Link>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            )}

            <Link
              href="/"
              className="text-xl font-semibold text-slate-900 hover:text-slate-700 transition-colors"
            >
              {title}
            </Link>
          </div>

          {/* 中央 - ナビゲーションメニュー（デスクトップのみ） */}
          {showNavigation && (
            <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <IconComponent className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* 右側 - ユーザー情報/アクション（デスクトップのみ） */}
          <div className="ml-auto hidden md:flex items-center gap-2">
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
                  <div className="hidden lg:block text-left">
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

          {/* 右側 - シンプルなユーザーアバター（モバイルのみ） */}
          {user && (
            <div className="ml-auto md:hidden">
              <button
                onClick={handleProfileClick}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profile_image || undefined} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </button>
            </div>
          )}

          {/* 未ログイン時のモバイル用ボタン */}
          {!user && (
            <div className="ml-auto md:hidden">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  ログイン
                </Button>
              </Link>
            </div>
          )}
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
