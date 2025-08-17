"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Users, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  bio?: string;
  birthday?: string;
  profile_image?: string;
  birthday_visibility?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  created_at: string;
  is_following?: boolean;
}

interface ProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({
  userId,
  isOpen,
  onClose,
}: ProfileModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserProfile(userId);
    }
  }, [userId, isOpen]);

  const fetchUserProfile = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${id}/profile`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("プロフィールの取得に失敗しました");
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const formatJoinDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ja });
  };

  const formatBirthday = (birthday: string) => {
    const date = new Date(birthday);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleFollowToggle = async () => {
    if (!user) return;

    try {
      const method = user.is_following ? "DELETE" : "POST";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/follow`,
        {
          method,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("フォロー操作に失敗しました");
      }

      // プロフィールを再取得してUIを更新
      await fetchUserProfile(user.id);
    } catch (err) {
      console.error("フォロー操作エラー:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>プロフィール</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="text-sm text-gray-500">読み込み中...</div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-sm text-red-500">{error}</div>
          </div>
        )}

        {user && !loading && (
          <div className="space-y-6">
            {/* プロフィール画像と基本情報 */}
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="w-24 h-24 border-2 border-gray-200">
                <AvatarImage src={user.profile_image || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h3 className="text-xl font-semibold">
                  {user.name || user.username}
                </h3>
                {user.username && (
                  <p className="text-sm text-gray-500">@{user.username}</p>
                )}
              </div>
            </div>

            {/* 自己紹介 */}
            {user.bio && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  自己紹介
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {user.bio}
                </p>
              </div>
            )}

            {/* 誕生日（公開設定の場合のみ） */}
            {user.birthday && user.birthday_visibility === "public" && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  誕生日: {formatBirthday(user.birthday)}
                </span>
              </div>
            )}

            {/* フォロー情報 */}
            <div className="flex items-center justify-center space-x-6">
              <div className="text-center">
                <div className="font-semibold">{user.posts_count || 0}</div>
                <span className="text-xs text-gray-500">投稿</span>
              </div>

              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <UserPlus className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold">
                    {user.following_count || 0}
                  </span>
                </div>
                <span className="text-xs text-gray-500">フォロー中</span>
              </div>

              <div className="text-center">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold">
                    {user.followers_count || 0}
                  </span>
                </div>
                <span className="text-xs text-gray-500">フォロワー</span>
              </div>
            </div>

            {/* 参加日 */}
            <div className="text-center text-xs text-gray-500">
              {formatJoinDate(user.created_at)}に参加
            </div>

            {/* フォローボタン */}
            <div className="flex justify-center">
              <Button
                variant={user.is_following ? "outline" : "default"}
                className="w-full"
                onClick={handleFollowToggle}
              >
                {user.is_following ? "フォロー中" : "フォローする"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
