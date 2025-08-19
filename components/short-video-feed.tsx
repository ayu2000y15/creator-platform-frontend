"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Post, postApi } from "@/lib/post-api";
import ShortVideoCard from "@/components/short-video-card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  Send,
  Users,
  Video,
  DollarSign,
  Maximize2,
  X,
  Heart,
  Zap,
  Bookmark,
  MessageCircle,
  RefreshCw,
  Play,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import TabNavigation from "@/components/tab-navigation";

interface ShortVideoFeedProps {
  activeTab: "recommend" | "following" | "short" | "paid";
  onTabChange: (tab: "recommend" | "following" | "short" | "paid") => void;
}

export default function ShortVideoFeed({
  activeTab,
  onTabChange,
}: ShortVideoFeedProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // タブ情報の定義
  const tabs = [
    {
      key: "recommend" as const,
      label: "全体",
      icon: Sparkles,
    },
    {
      key: "following" as const,
      label: "フォロー中",
      icon: Users,
    },
    {
      key: "short" as const,
      label: "ショート",
      icon: Video,
    },
    {
      key: "paid" as const,
      label: "有料",
      icon: DollarSign,
    },
  ];

  const loadPosts = useCallback(
    async (cursor?: string, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const response = await postApi.getPosts(cursor, "short");
        const newPosts =
          isRefresh || !cursor ? response.data : [...posts, ...response.data];

        setPosts(newPosts);
        setNextCursor(response.next_cursor);
        setHasMore(!!response.next_cursor);
      } catch {
        toast({
          title: "エラー",
          description: "ショート動画の読み込みに失敗しました",
          variant: "destructive",
        });
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [toast, posts]
  );

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // スクロールイベントハンドラ（フルスクリーン時のみ）
  const handleScroll = useCallback(
    (event: WheelEvent) => {
      if (!isFullscreen) return;

      event.preventDefault();

      if (loading) return;

      if (event.deltaY > 0) {
        // 下スクロール：次の動画
        if (fullscreenIndex < posts.length - 1) {
          setFullscreenIndex(fullscreenIndex + 1);
        } else if (hasMore && !loading) {
          // 最後の動画で、まだ読み込み可能な場合
          loadPosts(nextCursor);
        }
      } else {
        // 上スクロール：前の動画
        if (fullscreenIndex > 0) {
          setFullscreenIndex(fullscreenIndex - 1);
        }
      }
    },
    [
      isFullscreen,
      fullscreenIndex,
      posts.length,
      hasMore,
      loading,
      nextCursor,
      loadPosts,
    ]
  );

  // キーボードイベントハンドラ（フルスクリーン時のみ）
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isFullscreen) return;

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (fullscreenIndex > 0) {
          setFullscreenIndex(fullscreenIndex - 1);
        }
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (fullscreenIndex < posts.length - 1) {
          setFullscreenIndex(fullscreenIndex + 1);
        } else if (hasMore && !loading) {
          loadPosts(nextCursor);
        }
      } else if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    },
    [
      isFullscreen,
      fullscreenIndex,
      posts.length,
      hasMore,
      loading,
      nextCursor,
      loadPosts,
    ]
  );

  // 動画クリック時の処理
  const handleVideoClick = (index: number) => {
    setIsFullscreen(true);
    setFullscreenIndex(index);
  };

  // フルスクリーンを閉じる
  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
  };

  // リフレッシュ処理
  const handleRefresh = () => {
    loadPosts(undefined, true);
  };

  // イベントリスナーの設定（フルスクリーン時のみ）
  useEffect(() => {
    if (!isFullscreen) return;

    const container = fullscreenContainerRef.current;
    if (container) {
      const onTouchStart = (e: TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
      };

      const onTouchMove = (e: TouchEvent) => {
        touchEndY.current = e.touches[0].clientY;
      };

      const onTouchEnd = () => {
        if (touchStartY.current == null || touchEndY.current == null) return;
        const delta = touchStartY.current - touchEndY.current;
        const threshold = 50; // px
        if (Math.abs(delta) > threshold) {
          if (delta > 0) {
            // swipe up -> next
            if (fullscreenIndex < posts.length - 1) setFullscreenIndex((i) => i + 1);
            else if (hasMore && !loading) loadPosts(nextCursor);
          } else {
            // swipe down -> prev
            if (fullscreenIndex > 0) setFullscreenIndex((i) => i - 1);
          }
        }
        touchStartY.current = null;
        touchEndY.current = null;
      };

      container.addEventListener("wheel", handleScroll, { passive: false });
      container.addEventListener("touchstart", onTouchStart, { passive: true });
      container.addEventListener("touchmove", onTouchMove, { passive: true });
      container.addEventListener("touchend", onTouchEnd);
      window.addEventListener("keydown", handleKeyDown);

      return () => {
  container.removeEventListener("wheel", handleScroll);
  container.removeEventListener("touchstart", onTouchStart as any);
  container.removeEventListener("touchmove", onTouchMove as any);
  container.removeEventListener("touchend", onTouchEnd as any);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isFullscreen, handleScroll, handleKeyDown]);

  // コメントページへの遷移
  const handleCommentClick = (postId: string, event: React.MouseEvent) => {
    console.log("=== Comment button clicked ===");
    console.log("Post ID:", postId);
    console.log("Event target:", event.target);

    event.stopPropagation();
    event.preventDefault();

    // 直接的な遷移を試行
    console.log("Attempting navigation to:", `/posts/${postId}`);
    window.location.href = `/posts/${postId}`;
  };

  // アクション処理
  const handleToggleAction = async (
    postId: string,
    actionType: "like" | "spark" | "bookmark"
  ) => {
    if (!user) {
      toast({ title: "ログインが必要です", variant: "destructive" });
      return;
    }

    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return;

    const originalPost = posts[postIndex];
    const isCurrentlyActive =
      actionType === "like"
        ? !!originalPost.is_liked
        : actionType === "spark"
        ? !!originalPost.is_sparked
        : !!originalPost.is_bookmarked;

    // オプティミスティック更新
    const updatedPost: Post = { ...originalPost };

    if (actionType === "like") {
      updatedPost.is_liked = !isCurrentlyActive;
      updatedPost.likes_count = isCurrentlyActive
        ? Math.max(0, originalPost.likes_count - 1)
        : originalPost.likes_count + 1;
    } else if (actionType === "spark") {
      updatedPost.is_sparked = !isCurrentlyActive;
      updatedPost.sparks_count = isCurrentlyActive
        ? Math.max(0, originalPost.sparks_count - 1)
        : originalPost.sparks_count + 1;
    } else if (actionType === "bookmark") {
      updatedPost.is_bookmarked = !isCurrentlyActive;
      updatedPost.bookmarks_count = isCurrentlyActive
        ? Math.max(0, originalPost.bookmarks_count - 1)
        : originalPost.bookmarks_count + 1;
    }

    const newPosts = [...posts];
    newPosts[postIndex] = updatedPost;
    setPosts(newPosts);

    try {
      if (actionType === "like") {
        if (isCurrentlyActive) {
          await postApi.unlikePost(postId);
        } else {
          await postApi.likePost(postId);
        }
      } else if (actionType === "spark") {
        if (isCurrentlyActive) {
          await postApi.unsparkPost(postId);
        } else {
          await postApi.sparkPost(postId);
        }
      } else if (actionType === "bookmark") {
        if (isCurrentlyActive) {
          await postApi.unbookmarkPost(postId);
        } else {
          await postApi.bookmarkPost(postId);
        }
      }
    } catch (error) {
      // エラー時は元に戻す
      console.error(`${actionType} action failed:`, error);
      const revertedPosts = [...posts];
      revertedPosts[postIndex] = originalPost;
      setPosts(revertedPosts);

      toast({
        title: "エラー",
        description: "操作に失敗しました",
        variant: "destructive",
      });
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* メインコンテンツ */}
        <div className="max-w-2xl mx-auto space-y-4">
          {/* 更新ボタン */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "更新中..." : "更新"}
            </Button>
          </div>

          {/* タブナビゲーション */}
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />

          {/* ローディング表示 */}
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* メインコンテンツ */}
        <div className="max-w-2xl mx-auto space-y-4">
          {/* 更新ボタン */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "更新中..." : "更新"}
            </Button>
          </div>

          {/* タブナビゲーション */}
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />

          {/* 空の状態 */}
          <div className="text-center py-8 text-gray-500">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">ショート動画がありません</p>
            <p className="text-sm text-gray-400 mt-2">
              フォロー中のユーザーのショート動画がここに表示されます
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* メインコンテンツ */}
        <div className="max-w-2xl mx-auto space-y-4">
          {/* 更新ボタン */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "更新中..." : "更新"}
            </Button>
          </div>

          {/* タブナビゲーション */}
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />

          {/* ショート動画グリッド */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
            {posts.map((post, index) => {
              console.log("Post data:", post);
              return (
                <div
                  key={post.id}
                  className="relative aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-200"
                  onClick={() => handleVideoClick(index)}
                  onMouseEnter={(e) => {
                    const video = e.currentTarget.querySelector(
                      "video"
                    ) as HTMLVideoElement;
                    if (video) {
                      video.muted = true;
                      video.currentTime = 0;
                      video.play().catch((error) => {
                        console.log("Video play failed:", error);
                      });
                    }
                  }}
                  onMouseLeave={(e) => {
                    const video = e.currentTarget.querySelector(
                      "video"
                    ) as HTMLVideoElement;
                    if (video) {
                      video.pause();
                      video.currentTime = 0;
                    }
                  }}
                >
                  {/* 動画サムネイル/プレビュー */}
                  {post.media && post.media[0]?.file_path ? (
                    <>
                      {console.log("Video path:", post.media[0].file_path)}
                      <video
                        src={post.media[0].file_path}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        controls={false}
                        onLoadStart={() => console.log("Video load start")}
                        onLoadedData={() => console.log("Video loaded data")}
                        onCanPlay={() => console.log("Video can play")}
                        onError={(e) => {
                          console.log("Video load error:", e);
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {/* ホバー時の再生ボタン */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="bg-black bg-opacity-50 rounded-full p-3">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    // 動画がない場合のフォールバック表示
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-xs opacity-75">動画なし</p>
                      </div>
                    </div>
                  )}

                  {/* 拡大アイコンオーバーレイ */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-black bg-opacity-50 p-1 rounded">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* 統計情報 */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-xs line-clamp-2 mb-2 drop-shadow-lg">
                      {post.text_content}
                    </p>
                    <div className="flex items-center justify-between text-white text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Heart
                            className={`w-3 h-3 drop-shadow ${
                              post.is_liked ? "fill-red-500 text-red-500" : ""
                            }`}
                          />
                          <span className="drop-shadow">
                            {post.likes_count}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Send
                            className={`w-3 h-3 drop-shadow ${
                              post.is_sparked
                                ? "fill-yellow-500 text-yellow-500"
                                : ""
                            }`}
                          />
                          <span className="drop-shadow">
                            {post.sparks_count}
                          </span>
                        </div>
                      </div>
                      {/* コメントボタンを右側に独立配置 */}
                      <button
                        onClick={(e) => {
                          console.log("Button click event fired!");
                          handleCommentClick(post.id, e);
                        }}
                        className="flex items-center space-x-1 hover:opacity-80 transition-opacity bg-black bg-opacity-50 rounded-full px-3 py-1 min-w-[60px] z-10"
                        style={{ pointerEvents: "auto" }}
                      >
                        <MessageCircle className="w-4 h-4 drop-shadow text-white" />
                        <span className="drop-shadow text-white text-xs">
                          {post.replies_count}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* もっと読み込むボタン */}
          {hasMore && (
            <div className="text-center mt-8">
              <Button
                onClick={() => loadPosts(nextCursor)}
                disabled={loading}
                className="px-8 py-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    読み込み中...
                  </>
                ) : (
                  "もっと見る"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* フルスクリーンモーダル */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black">
          <div
            ref={fullscreenContainerRef}
            className="h-full overflow-hidden relative focus:outline-none"
            tabIndex={0}
          >
            {/* 閉じるボタン */}
            <Button
              onClick={handleCloseFullscreen}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* 現在の動画を表示 */}
            {posts[fullscreenIndex] && (
              <ShortVideoCard
                post={posts[fullscreenIndex]}
                isActive={true}
                isFullscreen={true}
                onToggleAction={handleToggleAction}
              />
            )}

            {/* プリロード用（非表示） */}
            {posts[fullscreenIndex + 1] && (
              <div className="absolute top-full">
                <ShortVideoCard
                  post={posts[fullscreenIndex + 1]}
                  isActive={false}
                  onToggleAction={handleToggleAction}
                />
              </div>
            )}

            {/* ナビゲーションヒント */}
            {/* index display removed as per UI requirement */}

            {/* 操作ヒント */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-xs bg-black bg-opacity-50 px-3 py-1 rounded-full">
              スクロールまたは↑↓キーで操作・ESCで終了
            </div>
          </div>
        </div>
      )}
    </>
  );
}
