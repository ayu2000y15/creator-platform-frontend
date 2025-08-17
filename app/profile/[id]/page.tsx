"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  User,
  CalendarDays,
  MapPin,
  Edit,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Share2,
  Heart,
} from "lucide-react";
import PostCard from "@/components/post-card";
import PostCreateModal from "@/components/post-create-modal";
import AppHeader from "@/components/app-header";
import { Post } from "@/lib/post-api";
import { useAuth } from "@/contexts/auth-context";

interface Profile {
  id: number;
  username: string;
  email: string;
  display_name: string;
  bio: string | null;
  avatar: string | null;
  location: string | null;
  birthday: string | null;
  birthday_visibility: "public" | "private";
  created_at: string;
  posts_count: number;
  following_count: number;
  followers_count: number;
  is_following: boolean;
  is_own_profile?: boolean;
  post_stats?: {
    total: number;
    by_content_type: {
      text: {
        free: number;
        paid: number;
      };
      video: {
        free: number;
        paid: number;
      };
      short_video: {
        free: number;
        paid: number;
      };
    };
    by_payment: {
      free: number;
      paid: number;
    };
  };
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [likedPostsLoading, setLikedPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quotedPost, setQuotedPost] = useState<Post | undefined>();
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "text" | "video" | "short_video" | "likes"
  >("text");

  // 処理中のアクションを追跡するstate
  const [processingActions, setProcessingActions] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchUserPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (userId && activeTab === "likes") {
      fetchLikedPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("プロフィールの取得に失敗しました");
      }

      const data = await response.json();
      setProfile(data.user);
    } catch (err: Error | unknown) {
      console.error("プロフィール取得エラー:", err);
      const errorMessage =
        err instanceof Error ? err.message : "プロフィールの取得に失敗しました";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/posts`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("投稿の取得に失敗しました");
      }

      const data = await response.json();
      setPosts(data.data || []);
    } catch (err: Error | unknown) {
      console.error("投稿取得エラー:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchLikedPosts = async () => {
    try {
      setLikedPostsLoading(true);
      const token = localStorage.getItem("auth_token");
      console.log("Fetching liked posts for user:", userId);
      console.log("Auth token:", token ? "exists" : "missing");

      // まず認証状態を確認
      if (token) {
        try {
          const userResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/user`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log("Current user check status:", userResponse.status);
          if (userResponse.ok) {
            const currentUser = await userResponse.json();
            console.log("Current user:", currentUser);
          } else {
            console.log("Auth failed, status:", userResponse.status);
          }
        } catch (authError) {
          console.log("Auth check error:", authError);
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/likes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        throw new Error("いいねした投稿の取得に失敗しました");
      }

      const data = await response.json();
      console.log("Liked posts data:", data);
      setLikedPosts(data.data || []);
    } catch (err: Error | unknown) {
      console.error("いいねした投稿取得エラー:", err);
    } finally {
      setLikedPostsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    // 認証チェック
    if (!currentUser) {
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}&action=follow`
      );
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const method = profile.is_following ? "DELETE" : "POST";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/follow`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("フォロー操作に失敗しました");
      }

      // プロフィールを再取得
      fetchProfile();
    } catch (err: Error | unknown) {
      console.error("フォロー処理エラー:", err);
    }
  };

  // 元の投稿IDを取得するヘルパー関数
  const getOriginalPostId = (post: Post): string => {
    // リポスト投稿の場合は quoted_post の ID を返す
    if (post.is_repost && post.quoted_post) {
      return post.quoted_post.id;
    }
    // 通常の投稿の場合はそのままのIDを返す
    return post.id;
  };

  // 投稿とその関連投稿（リポスト）を更新するヘルパー関数
  const updatePostsWithSync = (
    postsArray: Post[],
    targetPostId: string,
    actionType: "like" | "spark" | "bookmark",
    isCurrentlyActive: boolean
  ): Post[] => {
    return postsArray.map((post) => {
      const originalPostId = getOriginalPostId(post);

      // 元の投稿またはそのリポストの場合に更新
      if (post.id === targetPostId || originalPostId === targetPostId) {
        const updatedPost = { ...post };

        // アクション状態を更新
        if (actionType === "like") {
          updatedPost.is_liked = !isCurrentlyActive;
          updatedPost.likes_count = isCurrentlyActive
            ? Math.max(0, post.likes_count - 1)
            : post.likes_count + 1;
        } else if (actionType === "spark") {
          updatedPost.is_sparked = !isCurrentlyActive;
          updatedPost.sparks_count = isCurrentlyActive
            ? Math.max(0, post.sparks_count - 1)
            : post.sparks_count + 1;
        } else if (actionType === "bookmark") {
          updatedPost.is_bookmarked = !isCurrentlyActive;
          updatedPost.bookmarks_count = isCurrentlyActive
            ? Math.max(0, post.bookmarks_count - 1)
            : post.bookmarks_count + 1;
        }

        // リポスト投稿の場合は quoted_post も更新
        if (updatedPost.is_repost && updatedPost.quoted_post) {
          updatedPost.quoted_post = {
            ...updatedPost.quoted_post,
            is_liked:
              actionType === "like"
                ? !isCurrentlyActive
                : updatedPost.quoted_post.is_liked,
            is_sparked:
              actionType === "spark"
                ? !isCurrentlyActive
                : updatedPost.quoted_post.is_sparked,
            is_bookmarked:
              actionType === "bookmark"
                ? !isCurrentlyActive
                : updatedPost.quoted_post.is_bookmarked,
            likes_count:
              actionType === "like"
                ? isCurrentlyActive
                  ? Math.max(0, updatedPost.quoted_post.likes_count - 1)
                  : updatedPost.quoted_post.likes_count + 1
                : updatedPost.quoted_post.likes_count,
            sparks_count:
              actionType === "spark"
                ? isCurrentlyActive
                  ? Math.max(0, updatedPost.quoted_post.sparks_count - 1)
                  : updatedPost.quoted_post.sparks_count + 1
                : updatedPost.quoted_post.sparks_count,
            bookmarks_count:
              actionType === "bookmark"
                ? isCurrentlyActive
                  ? Math.max(0, updatedPost.quoted_post.bookmarks_count - 1)
                  : updatedPost.quoted_post.bookmarks_count + 1
                : updatedPost.quoted_post.bookmarks_count,
          };
        }

        return updatedPost;
      }

      return post;
    });
  };

  // APIレスポンスの実際の状態に基づいて投稿を更新する関数
  const updatePostsWithActualState = (
    postsArray: Post[],
    targetPostId: string,
    actionType: "like" | "spark" | "bookmark",
    actualState: boolean,
    actualCount: number
  ): Post[] => {
    return postsArray.map((post) => {
      const originalPostId = getOriginalPostId(post);

      // 元の投稿またはそのリポストの場合に更新
      if (post.id === targetPostId || originalPostId === targetPostId) {
        const updatedPost = { ...post };

        // 実際の状態に基づいて更新
        if (actionType === "spark") {
          updatedPost.is_sparked = actualState;
          updatedPost.sparks_count = actualCount;
        }

        // リポスト投稿の場合は quoted_post も更新
        if (updatedPost.is_repost && updatedPost.quoted_post) {
          updatedPost.quoted_post = {
            ...updatedPost.quoted_post,
            is_sparked:
              actionType === "spark"
                ? actualState
                : updatedPost.quoted_post.is_sparked,
            sparks_count:
              actionType === "spark"
                ? actualCount
                : updatedPost.quoted_post.sparks_count,
          };
        }

        return updatedPost;
      }

      return post;
    });
  };

  const handlePostAction = async (
    postId: string,
    actionType: "like" | "spark" | "bookmark"
  ) => {
    // 元の投稿を検索（リポスト投稿からでも元の投稿を特定）
    const targetPost =
      posts.find((p) => {
        const originalPostId = getOriginalPostId(p);
        return p.id === postId || originalPostId === postId;
      }) ||
      likedPosts.find((p) => {
        const originalPostId = getOriginalPostId(p);
        return p.id === postId || originalPostId === postId;
      });

    if (!targetPost) return;

    // 元の投稿IDを取得
    const originalPostId = getOriginalPostId(targetPost);

    // 重複処理を防ぐためのキーを生成
    const actionKey = `${originalPostId}_${actionType}`;

    // 既に処理中の場合はスキップ
    if (processingActions.has(actionKey)) {
      return;
    }

    // 処理開始をマーク
    setProcessingActions((prev) => new Set(prev).add(actionKey));

    try {
      const token = localStorage.getItem("auth_token");

      // 現在のアクション状態を正しく取得（リポスト投稿の場合は quoted_post から取得）
      const postToCheck =
        targetPost.is_repost && targetPost.quoted_post
          ? targetPost.quoted_post
          : targetPost;
      let isActive = false;

      switch (actionType) {
        case "like":
          isActive = postToCheck.is_liked || false;
          break;
        case "spark":
          isActive = postToCheck.is_sparked || false;
          break;
        case "bookmark":
          isActive = postToCheck.is_bookmarked || false;
          break;
      }

      // スパークの場合の特別処理
      if (actionType === "spark") {
        const method = isActive ? "DELETE" : "POST";
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/posts/${originalPostId}/spark`,
          {
            method,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          // APIレスポンスから正確な状態を取得
          const responseData = await response.json();

          if (isActive) {
            // スパーク解除時：自分のリポスト表示を削除
            const newPostsAfterUnspark = posts.filter(
              (p) =>
                !(
                  p.is_repost &&
                  p.repost_user?.id === currentUser?.id &&
                  (p.id === originalPostId ||
                    (p.quoted_post && p.quoted_post.id === originalPostId))
                )
            );
            setPosts(newPostsAfterUnspark);

            // いいねした投稿からも削除
            const newLikedPostsAfterUnspark = likedPosts.filter(
              (p) =>
                !(
                  p.is_repost &&
                  p.repost_user?.id === currentUser?.id &&
                  (p.id === originalPostId ||
                    (p.quoted_post && p.quoted_post.id === originalPostId))
                )
            );
            setLikedPosts(newLikedPostsAfterUnspark);
          } else {
            // スパーク実行時：即座にリポスト表示を追加
            const originalPost =
              posts.find(
                (p) =>
                  p.id === originalPostId ||
                  getOriginalPostId(p) === originalPostId
              ) ||
              likedPosts.find(
                (p) =>
                  p.id === originalPostId ||
                  getOriginalPostId(p) === originalPostId
              );

            if (originalPost && currentUser) {
              // リポスト表示用の投稿を作成
              const repostEntry: Post = {
                ...originalPost,
                is_repost: true,
                repost_user: {
                  id: currentUser.id,
                  name: currentUser.name,
                  username: currentUser.username || undefined,
                  profile_image: currentUser.profile_image || undefined,
                },
                repost_created_at: new Date().toISOString(),
                // リポスト表示用の一意IDを生成
                id: `repost_${originalPostId}_${currentUser.id}_${Date.now()}`,
              };

              // プロフィールページの場合、自分のスパークのみを表示
              if (profile && profile.id === currentUser.id) {
                setPosts((prevPosts) => [repostEntry, ...prevPosts]);
              }
            }
          }

          // レスポンスデータを使用して正確な状態を更新
          if (
            responseData &&
            "is_sparked" in responseData &&
            "sparks_count" in responseData
          ) {
            const actualIsSparkState = responseData.is_sparked;
            const actualSparksCount = responseData.sparks_count;

            // 実際の状態に基づいて投稿を更新
            setPosts((prevPosts) =>
              updatePostsWithActualState(
                prevPosts,
                originalPostId,
                "spark",
                actualIsSparkState,
                actualSparksCount
              )
            );
            setLikedPosts((prevLikedPosts) =>
              updatePostsWithActualState(
                prevLikedPosts,
                originalPostId,
                "spark",
                actualIsSparkState,
                actualSparksCount
              )
            );
          } else {
            // フォールバック：従来の同期更新
            setPosts((prevPosts) =>
              updatePostsWithSync(
                prevPosts,
                originalPostId,
                actionType,
                isActive
              )
            );
            setLikedPosts((prevLikedPosts) =>
              updatePostsWithSync(
                prevLikedPosts,
                originalPostId,
                actionType,
                isActive
              )
            );
          }
        }
        return;
      }

      // 他のアクション（like, bookmark）の処理
      const method = isActive ? "DELETE" : "POST";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/posts/${originalPostId}/${actionType}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // 関連する全ての投稿を同期更新
        setPosts((prevPosts) =>
          updatePostsWithSync(prevPosts, originalPostId, actionType, isActive)
        );
        setLikedPosts((prevLikedPosts) =>
          updatePostsWithSync(
            prevLikedPosts,
            originalPostId,
            actionType,
            isActive
          )
        );
      }
    } catch (err) {
      console.error("アクション実行エラー:", err);
    } finally {
      // 処理完了をマーク
      setProcessingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handlePostDelete = (deletedPostId: string) => {
    // postsから削除された投稿を除外
    setPosts((prevPosts) =>
      prevPosts.filter((post) => post.id !== deletedPostId)
    );

    // likedPostsからも削除された投稿を除外
    setLikedPosts((prevLikedPosts) =>
      prevLikedPosts.filter((post) => post.id !== deletedPostId)
    );

    // プロフィールの投稿数を更新
    if (profile) {
      setProfile((prevProfile) => {
        if (!prevProfile) return prevProfile;
        return {
          ...prevProfile,
          posts_count: Math.max(0, prevProfile.posts_count - 1),
        };
      });
    }
  };

  const handleCreatePost = () => {
    setShowCreateModal(true);
  };

  const handlePostCreated = (newPost?: Post) => {
    setShowCreateModal(false);
    if (newPost) {
      // 新しい投稿をリストの先頭に追加（全体の再取得を避ける）
      setPosts((prevPosts) => [newPost, ...prevPosts]);
      // プロフィール情報のみ再取得（投稿数の更新のため）
      fetchProfile();
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setQuotedPost(undefined);
  };

  const handleQuote = (post: Post) => {
    // 引用投稿モーダルを表示
    setQuotedPost(post);
    setShowCreateModal(true);
    console.log("Quote post:", post.id);
  };

  const formatBirthday = (birthday: string) => {
    const date = new Date(birthday);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

  // 投稿をコンテンツタイプでフィルタリング
  const filteredPosts = (() => {
    if (activeTab === "likes") {
      return likedPosts;
    } else {
      return posts.filter((post) => {
        if (activeTab === "text") {
          return post.content_type === "text" || post.content_type === "quote";
        }
        return post.content_type === activeTab;
      });
    }
  })();

  // タブ情報の定義
  const tabs = [
    { key: "text" as const, label: "テキスト", icon: FileText },
    { key: "video" as const, label: "動画", icon: Video },
    { key: "short_video" as const, label: "ショート", icon: Share2 },
    { key: "likes" as const, label: "いいね", icon: Heart },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-2xl mx-auto p-4">
          <div className="text-center py-8 text-red-500">
            {error || "プロフィールが見つかりません"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-2xl mx-auto p-4">
        {/* 戻るボタン */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>戻る</span>
          </Button>
        </div>

        {/* プロフィール情報 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={profile.avatar || "/placeholder-user.jpg"} />
                <AvatarFallback>
                  <User className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h1 className="text-xl font-bold">
                      {profile.display_name}
                    </h1>
                    <p className="text-sm text-gray-500">@{profile.username}</p>
                  </div>

                  {/* フォロー・編集ボタン */}
                  {isOwnProfile ? (
                    <Button
                      variant="outline"
                      onClick={() => router.push("/profile/edit")}
                    >
                      プロフィールを編集
                    </Button>
                  ) : (
                    <Button
                      variant={profile.is_following ? "outline" : "default"}
                      onClick={handleFollow}
                    >
                      {profile.is_following ? "フォロー中" : "フォロー"}
                    </Button>
                  )}
                </div>

                {/* 自己紹介 */}
                {profile.bio && (
                  <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                )}

                {/* 場所 */}
                {profile.location && (
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {profile.location}
                    </span>
                  </div>
                )}

                {/* 誕生日（公開設定の場合のみ） */}
                {profile.birthday &&
                  profile.birthday_visibility === "public" && (
                    <div className="flex items-center space-x-2 mb-4">
                      <CalendarDays className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        誕生日: {formatBirthday(profile.birthday)}
                      </span>
                    </div>
                  )}

                <Separator className="my-4" />

                {/* 統計情報 */}
                <div className="space-y-4">
                  {/* 基本統計 */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="font-semibold text-lg">
                        {profile.posts_count}
                      </div>
                      <div className="text-xs text-gray-500">
                        {profile.is_own_profile ? "投稿" : "閲覧可能投稿"}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        {profile.following_count}
                      </div>
                      <div className="text-xs text-gray-500">フォロー</div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        {profile.followers_count}
                      </div>
                      <div className="text-xs text-gray-500">フォロワー</div>
                    </div>
                  </div>

                  {/* 投稿詳細統計 */}
                  {profile.post_stats && (
                    <div className="space-y-3">
                      <Separator />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetailedStats(!showDetailedStats)}
                        className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <span>投稿詳細</span>
                        {showDetailedStats ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>

                      {showDetailedStats && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-3 py-2 text-left font-medium text-gray-600">
                                  タイプ別
                                </th>
                                <th className="px-3 py-2 text-center font-medium text-gray-600">
                                  無料コンテンツ
                                </th>
                                <th className="px-3 py-2 text-center font-medium text-gray-600">
                                  有料コンテンツ
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-t border-gray-100">
                                <td className="px-3 py-2 font-medium">
                                  テキスト：
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {profile.post_stats.by_content_type.text.free}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {profile.post_stats.by_content_type.text.paid}
                                </td>
                              </tr>
                              <tr className="border-t border-gray-100">
                                <td className="px-3 py-2 font-medium">
                                  動画：
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {
                                    profile.post_stats.by_content_type.video
                                      .free
                                  }
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {
                                    profile.post_stats.by_content_type.video
                                      .paid
                                  }
                                </td>
                              </tr>
                              <tr className="border-t border-gray-100">
                                <td className="px-3 py-2 font-medium">
                                  ショート：
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {
                                    profile.post_stats.by_content_type
                                      .short_video.free
                                  }
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {
                                    profile.post_stats.by_content_type
                                      .short_video.paid
                                  }
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 投稿作成フォーム */}
        {/* モーダルに変更するため、ここは削除 */}

        {/* 投稿一覧 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">投稿</h2>

          {/* タブナビゲーション */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${
                      activeTab === tab.key
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {(activeTab === "likes" ? likedPostsLoading : postsLoading) ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {activeTab === "likes"
                ? "まだいいねした投稿がありません"
                : posts.length === 0
                ? "まだ投稿がありません"
                : `${
                    tabs.find((t) => t.key === activeTab)?.label
                  }の投稿がありません`}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onQuote={handleQuote}
                  onToggleAction={handlePostAction}
                  onDelete={handlePostDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* 固定投稿ボタン */}
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
          onClick={handleCreatePost}
        >
          <Edit className="h-6 w-6" />
        </Button>

        {/* 投稿作成モーダル */}
        <PostCreateModal
          isOpen={showCreateModal}
          onClose={handleCancelCreate}
          onPostCreated={handlePostCreated}
          quotedPost={quotedPost}
        />
      </div>
    </div>
  );
}
