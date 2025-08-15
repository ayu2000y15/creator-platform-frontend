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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Save,
  User,
  Lock,
  Shield,
  AlertCircle,
  Upload,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const {
    user,
    loading,
    updateProfile,
    changePassword,
    uploadProfileImage,
    deleteProfileImage,
  } = useAuth();
  const router = useRouter();

  // プロフィール情報の状態 - userデータがある場合は初期値として設定
  const [profileData, setProfileData] = useState(() => {
    if (user) {
      return {
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        bio: user.bio || "",
        profile_image: user.profile_image || "",
        birthday: user.birthday ? user.birthday.split("T")[0] : "",
        birthday_visibility:
          (user.birthday_visibility as "full" | "month_day" | "hidden") ||
          "hidden",
        phone_number: user.phone_number || "",
      };
    }
    return {
      name: "",
      email: "",
      username: "",
      bio: "",
      profile_image: "",
      birthday: "",
      birthday_visibility: "hidden" as "full" | "month_day" | "hidden",
      phone_number: "",
    };
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [imageError, setImageError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [imageSuccess, setImageSuccess] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    // 初回ロード時のみデータを設定
    if (user && user.name && user.email && !isInitialized) {
      const newProfileData = {
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        bio: user.bio || "",
        profile_image: user.profile_image || "",
        birthday: user.birthday
          ? new Date(user.birthday).toLocaleDateString("en-CA")
          : "",
        birthday_visibility:
          (user.birthday_visibility as "full" | "month_day" | "hidden") ||
          "hidden",
        phone_number: user.phone_number || "",
      };

      setProfileData(newProfileData);
      setIsInitialized(true);
    }
  }, [user, loading, router, isInitialized]);

  const handleBackToProfile = () => {
    router.push("/profile");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    // 現在の値をuserデータでフォールバック
    const dataToSubmit = {
      name: profileData.name || user?.name || "",
      email: profileData.email || user?.email || "",
      username: profileData.username || user?.username || "",
      bio: profileData.bio || user?.bio || "",
      profile_image: profileData.profile_image || user?.profile_image || "",
      birthday:
        profileData.birthday ||
        (user?.birthday
          ? new Date(user.birthday).toLocaleDateString("en-CA")
          : ""),
      birthday_visibility:
        profileData.birthday_visibility ||
        user?.birthday_visibility ||
        "hidden",
      phone_number: profileData.phone_number || user?.phone_number || "",
    };

    try {
      await updateProfile(dataToSubmit);
      setProfileSuccess("プロフィールを更新しました");
    } catch (error) {
      console.error("Profile update error:", error);
      setProfileError("プロフィールの更新に失敗しました");
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
    } catch {
      setPasswordError("パスワードの変更に失敗しました");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError("ファイルサイズは5MB以下にしてください");
      return;
    }

    // ファイル形式チェック
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setImageError("JPEG、PNG、GIF、WebP形式の画像のみアップロード可能です");
      return;
    }

    setIsUploadingImage(true);
    setImageError("");
    setImageSuccess("");

    try {
      const imageUrl = await uploadProfileImage(file);
      setProfileData((prev) => ({ ...prev, profile_image: imageUrl }));
      setImageSuccess("プロフィール画像をアップロードしました");
      // ファイル入力をリセット
      e.target.value = "";
    } catch {
      setImageError("画像のアップロードに失敗しました");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageDelete = async () => {
    setImageError("");
    setImageSuccess("");

    try {
      await deleteProfileImage();
      setProfileData((prev) => ({ ...prev, profile_image: "" }));
      setImageSuccess("プロフィール画像を削除しました");
    } catch {
      setImageError("画像の削除に失敗しました");
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
                プロフィール情報
              </CardTitle>
              <CardDescription>
                プロフィール画像、基本情報、自己紹介を編集できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* プロフィール画像 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      {profileData.profile_image ? (
                        <AvatarImage
                          key={profileData.profile_image}
                          src={profileData.profile_image}
                          alt={profileData.name || "プロフィール"}
                        />
                      ) : (
                        <AvatarFallback className="text-xl bg-slate-200 text-slate-700">
                          {profileData.name.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="space-y-3">
                      <div>
                        <Label>プロフィール画像</Label>
                        <p className="text-sm text-slate-500">
                          JPEG、PNG、GIF、WebP形式、5MB以下
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="profile-image-upload"
                          disabled={isUploadingImage}
                        />
                        <label htmlFor="profile-image-upload">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploadingImage}
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploadingImage
                                ? "アップロード中..."
                                : "画像を選択"}
                            </span>
                          </Button>
                        </label>
                        {profileData.profile_image && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleImageDelete}
                            className="text-red-600 hover:text-red-700 bg-transparent"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            削除
                          </Button>
                        )}
                      </div>
                      {imageError && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {imageError}
                        </div>
                      )}
                      {imageSuccess && (
                        <div className="text-green-600 text-sm">
                          {imageSuccess}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 基本情報 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">名前</Label>
                    <Input
                      id="name"
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      placeholder="名前を入力"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">ユーザー名</Label>
                    <Input
                      id="username"
                      type="text"
                      value={profileData.username}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          username: e.target.value,
                        })
                      }
                      placeholder="username"
                    />
                    <p className="text-xs text-slate-500">
                      英数字とアンダースコアのみ使用可能
                    </p>
                  </div>
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
                    placeholder="メールアドレスを入力"
                    required
                  />
                </div>

                {/* 自己紹介 */}
                <div className="space-y-2">
                  <Label htmlFor="bio">自己紹介</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    placeholder="自己紹介を入力してください..."
                    maxLength={300}
                    rows={4}
                  />
                  <p className="text-xs text-slate-500">
                    {profileData.bio.length}/300文字
                  </p>
                </div>

                {/* 誕生日設定 */}
                <div className="space-y-4">
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthday_visibility">
                      誕生日の表示設定
                    </Label>
                    <Select
                      value={profileData.birthday_visibility}
                      onValueChange={(value: "full" | "month_day" | "hidden") =>
                        setProfileData({
                          ...profileData,
                          birthday_visibility: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hidden">非公開</SelectItem>
                        <SelectItem value="month_day">月日のみ表示</SelectItem>
                        <SelectItem value="full">年月日を表示</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      プロフィールでの誕生日の表示方法を選択できます
                    </p>
                  </div>
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
