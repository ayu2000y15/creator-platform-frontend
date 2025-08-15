"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, User, Lock, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const {
    user,
    loading,
    enableTwoFactor,
    disableTwoFactor,
    updateProfile,
    changePassword,
  } = useAuth();
  const router = useRouter();

  // プロフィール情報の状態
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    birthday: "",
    phone_number: "",
  });

  // パスワード変更の状態
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  // UI状態
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
        birthday: user.birthday ? user.birthday.split("T")[0] : "",
        phone_number: user.phone_number || "",
      });
    }
  }, [user, loading, router]);

  const handleBackToProfile = () => {
    router.push("/profile");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      await updateProfile(profileData);
      setProfileSuccess("プロフィールを更新しました");
    } catch (error: any) {
      setProfileError(
        error.response?.data?.message || "プロフィールの更新に失敗しました"
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordData.password !== passwordData.password_confirmation) {
      setPasswordError("新しいパスワードが一致しません");
      setIsChangingPassword(false);
      return;
    }

    try {
      await changePassword(passwordData);
      setPasswordSuccess("パスワードを変更しました");
      setPasswordData({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (error: any) {
      setPasswordError(
        error.response?.data?.message || "パスワードの変更に失敗しました"
      );
    } finally {
      setIsChangingPassword(false);
    }
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBackToProfile}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                プロフィールに戻る
              </Button>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">
              プロフィール編集
            </h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 基本情報編集 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                基本情報
              </CardTitle>
              <CardDescription>
                名前とメールアドレスを変更できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名前</Label>
                  <Input
                    id="name"
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">誕生日</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={profileData.birthday}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        birthday: e.target.value,
                      })
                    }
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-slate-500">
                    誕生日を設定すると、お誕生日に特別なサービスを受けられます
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">電話番号</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={profileData.phone_number}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        phone_number: e.target.value,
                      })
                    }
                    placeholder="090-1234-5678"
                  />
                  <p className="text-xs text-slate-500">
                    緊急時の連絡やサポートに使用します
                  </p>
                </div>

                {profileError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div className="text-green-600 text-sm">{profileSuccess}</div>
                )}

                <Button type="submit" disabled={isUpdatingProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdatingProfile ? "更新中..." : "保存"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* パスワード変更 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                パスワード変更
              </CardTitle>
              <CardDescription>
                セキュリティのため定期的にパスワードを変更することをお勧めします
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">現在のパスワード</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current_password: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">新しいパスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    value={passwordData.password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        password: e.target.value,
                      })
                    }
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">
                    新しいパスワード（確認）
                  </Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    value={passwordData.password_confirmation}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        password_confirmation: e.target.value,
                      })
                    }
                    required
                    minLength={8}
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="text-green-600 text-sm">
                    {passwordSuccess}
                  </div>
                )}

                <Button type="submit" disabled={isChangingPassword}>
                  <Lock className="h-4 w-4 mr-2" />
                  {isChangingPassword ? "変更中..." : "パスワードを変更"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
