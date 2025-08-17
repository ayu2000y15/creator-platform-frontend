"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Post, postApi } from "@/lib/post-api";
import PostCard from "@/components/post-card";
import PostCreateModal from "@/components/post-create-modal";
import ShortVideoFeed from "@/components/short-video-feed";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Sparkles,
  Users,
  Video,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

export default function PostFeed() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotedPost, setQuotedPost] = useState<Post | undefined>();
  const [activeTab, setActiveTab] = useState<
    "recommend" | "following" | "short" | "paid"
  >("recommend");

  // 処理中のアクションを追跡するstate
  const [processingActions, setProcessingActions] = useState<Set<string>>(
    new Set()
  );

  // タブごとのキャッシュ
  const [tabCache, setTabCache] = useState<
    Record<
      string,
      {
        posts: Post[];
        nextCursor?: string;
        hasMore: boolean;
        lastUpdated: number;
      }
    >
  >({});

  const CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ

  // タブ情報の定義
  const tabs = useMemo(
    () => [
      {
        key: "recommend" as const,
        label: "おすすめ",
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
    ],
    []
  );

  const loadPosts = useCallback(
    async (cursor?: string, isRefresh = false) => {
      // キャッシュをチェック
      if (!cursor && !isRefresh) {
        const cached = tabCache[activeTab];
        if (cached && Date.now() - cached.lastUpdated < CACHE_DURATION) {
          setPosts(cached.posts);
          setNextCursor(cached.nextCursor);
          setHasMore(cached.hasMore);
          return;
        }
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const response = await postApi.getPosts(cursor, activeTab);
        const newPosts =
          isRefresh || !cursor ? response.data : [...posts, ...response.data];

        setPosts(newPosts);
        setNextCursor(response.next_cursor);
        setHasMore(!!response.next_cursor);

        // キャッシュを更新
        setTabCache((prev) => ({
          ...prev,
          [activeTab]: {
            posts: newPosts,
            nextCursor: response.next_cursor,
            hasMore: !!response.next_cursor,
            lastUpdated: Date.now(),
          },
        }));
      } catch {
        toast({
          title: "エラー",
          description: "投稿の読み込みに失敗しました",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast, activeTab, tabCache, CACHE_DURATION, posts]
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 初回ロード時に他のタブをプリロード
  useEffect(() => {
    const preloadTabs = async () => {
      const tabsToPreload = tabs.filter((tab) => tab.key !== activeTab);

      for (const tab of tabsToPreload) {
        try {
          const response = await postApi.getPosts(undefined, tab.key);
          setTabCache((prev) => ({
            ...prev,
            [tab.key]: {
              posts: response.data,
              nextCursor: response.next_cursor,
              hasMore: !!response.next_cursor,
              lastUpdated: Date.now(),
            },
          }));
        } catch {
          // プリロード失敗は無視
        }
      }
    };

    // 初回ロード完了後、少し遅延してプリロード開始
    const timer = setTimeout(preloadTabs, 2000);
    return () => clearTimeout(timer);
  }, [activeTab, tabs]);

  // タブが変更されたときの処理
  const handleTabChange = (
    newTab: "recommend" | "following" | "short" | "paid"
  ) => {
    setActiveTab(newTab);

    // キャッシュをチェック
    const cached = tabCache[newTab];
    if (cached && Date.now() - cached.lastUpdated < CACHE_DURATION) {
      // キャッシュがあり、有効期限内の場合は即座に表示
      setPosts(cached.posts);
      setNextCursor(cached.nextCursor);
      setHasMore(cached.hasMore);
    } else {
      // キャッシュがない、または期限切れの場合は読み込み
      setPosts([]);
      setNextCursor(undefined);
      setHasMore(true);
    }
  };

  // タブが変更されたときに投稿を再読み込み
  useEffect(() => {
    loadPosts(undefined, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
        } else if (actionType === "like") {
          updatedPost.is_liked = actualState;
          updatedPost.likes_count = actualCount;
        } else if (actionType === "bookmark") {
          updatedPost.is_bookmarked = actualState;
          updatedPost.bookmarks_count = actualCount;
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
            is_liked:
              actionType === "like"
                ? actualState
                : updatedPost.quoted_post.is_liked,
            likes_count:
              actionType === "like"
                ? actualCount
                : updatedPost.quoted_post.likes_count,
            is_bookmarked:
              actionType === "bookmark"
                ? actualState
                : updatedPost.quoted_post.is_bookmarked,
            bookmarks_count:
              actionType === "bookmark"
                ? actualCount
                : updatedPost.quoted_post.bookmarks_count,
          };
        }

        return updatedPost;
      }

      return post;
    });
  };

  const handleToggleAction = async (
    postId: string,
    actionType: "like" | "spark" | "bookmark"
  ) => {
    if (!user) {
      toast({ title: "ログインが必要です", variant: "destructive" });
      return;
    }

    // 元の投稿を検索（リポスト投稿からでも元の投稿を特定）
    const targetPost = posts.find((p) => {
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
      // 現在のアクション状態を正しく取得（リポスト投稿の場合は quoted_post から取得）
      const postToCheck =
        targetPost.is_repost && targetPost.quoted_post
          ? targetPost.quoted_post
          : targetPost;
      const isCurrentlyActive =
        actionType === "like"
          ? !!postToCheck.is_liked
          : actionType === "spark"
          ? !!postToCheck.is_sparked
          : !!postToCheck.is_bookmarked;

      // API呼び出し（楽観的UI更新は行わず、レスポンス後に正確な状態で更新）
      if (actionType === "like") {
        if (isCurrentlyActive) {
          const response = await postApi.unlikePost(originalPostId);

          // APIレスポンスから正確な状態を取得
          if (
            response &&
            typeof response === "object" &&
            "is_liked" in response
          ) {
            const actualIsLikeState = response.is_liked ?? false;
            const actualLikesCount = response.likes_count || 0;

            // 実際の状態に基づいて更新
            const correctedPosts = updatePostsWithActualState(
              posts,
              originalPostId,
              "like",
              actualIsLikeState,
              actualLikesCount
            );
            setPosts(correctedPosts);
            setTabCache((prev) => ({
              ...prev,
              [activeTab]: {
                ...prev[activeTab],
                posts: correctedPosts,
                lastUpdated: Date.now(),
              },
            }));
          }
        } else {
          const response = await postApi.likePost(originalPostId);

          // APIレスポンスから正確な状態を取得
          if (
            response &&
            typeof response === "object" &&
            "is_liked" in response
          ) {
            const actualIsLikeState = response.is_liked ?? false;
            const actualLikesCount = response.likes_count || 0;

            // 実際の状態に基づいて更新
            const correctedPosts = updatePostsWithActualState(
              posts,
              originalPostId,
              "like",
              actualIsLikeState,
              actualLikesCount
            );
            setPosts(correctedPosts);
            setTabCache((prev) => ({
              ...prev,
              [activeTab]: {
                ...prev[activeTab],
                posts: correctedPosts,
                lastUpdated: Date.now(),
              },
            }));
          }
        }
      } else if (actionType === "spark") {
        if (isCurrentlyActive) {
          const response = await postApi.unsparkPost(originalPostId);

          // まず元の投稿のスパーク状態を更新
          let updatedPosts = posts;

          // APIレスポンスから正確な状態を取得
          if (
            response &&
            typeof response === "object" &&
            "is_sparked" in response
          ) {
            // レスポンスに状態情報がある場合はそれを使用
            const actualIsSparkState = response.is_sparked;
            const actualSparksCount = response.sparks_count || 0;

            // 実際の状態に基づいて更新
            updatedPosts = updatePostsWithActualState(
              posts,
              originalPostId,
              "spark",
              actualIsSparkState,
              actualSparksCount
            );
          }

          // スパーク解除時：自分のリポスト表示を削除
          updatedPosts = updatedPosts.filter(
            (p) =>
              !(
                p.is_repost &&
                p.repost_user?.id === user?.id &&
                (p.id === originalPostId ||
                  (p.quoted_post && p.quoted_post.id === originalPostId))
              )
          );

          // 最終的な状態を設定
          setPosts(updatedPosts);
          setTabCache((prev) => ({
            ...prev,
            [activeTab]: {
              ...prev[activeTab],
              posts: updatedPosts,
              lastUpdated: Date.now(),
            },
          }));
        } else {
          const response = await postApi.sparkPost(originalPostId);

          // まず元の投稿のスパーク状態を更新
          let updatedPosts = posts;

          // APIレスポンスから正確な状態を取得
          if (
            response &&
            typeof response === "object" &&
            "is_sparked" in response
          ) {
            const actualIsSparkState = response.is_sparked;
            const actualSparksCount = response.sparks_count || 0;

            // 実際の状態に基づいて更新
            updatedPosts = updatePostsWithActualState(
              posts,
              originalPostId,
              "spark",
              actualIsSparkState,
              actualSparksCount
            );
          }

          // スパーク実行時：リポスト表示を追加（状態更新後の投稿を使用）
          const originalPost = updatedPosts.find(
            (p) =>
              p.id === originalPostId || getOriginalPostId(p) === originalPostId
          );
          if (originalPost && user) {
            // リポスト表示用の投稿を作成
            const repostEntry: Post = {
              ...originalPost,
              is_repost: true,
              repost_user: {
                id: user.id,
                name: user.name,
                username: user.username || undefined,
                profile_image: user.profile_image || undefined,
              },
              repost_created_at: new Date().toISOString(),
              // リポスト表示用の一意IDを生成
              id: `repost_${originalPostId}_${user.id}_${Date.now()}`,
            };

            updatedPosts = [repostEntry, ...updatedPosts];
          }

          // 最終的な状態を設定
          setPosts(updatedPosts);
          setTabCache((prev) => ({
            ...prev,
            [activeTab]: {
              ...prev[activeTab],
              posts: updatedPosts,
              lastUpdated: Date.now(),
            },
          }));
        }
      } else if (actionType === "bookmark") {
        if (isCurrentlyActive) {
          const response = await postApi.unbookmarkPost(originalPostId);

          // APIレスポンスから正確な状態を取得
          if (
            response &&
            typeof response === "object" &&
            "is_bookmarked" in response
          ) {
            const actualIsBookmarkState = response.is_bookmarked ?? false;
            const actualBookmarksCount = response.bookmarks_count || 0;

            // 実際の状態に基づいて更新
            const correctedPosts = updatePostsWithActualState(
              posts,
              originalPostId,
              "bookmark",
              actualIsBookmarkState,
              actualBookmarksCount
            );
            setPosts(correctedPosts);
            setTabCache((prev) => ({
              ...prev,
              [activeTab]: {
                ...prev[activeTab],
                posts: correctedPosts,
                lastUpdated: Date.now(),
              },
            }));
          }
        } else {
          const response = await postApi.bookmarkPost(originalPostId);

          // APIレスポンスから正確な状態を取得
          if (
            response &&
            typeof response === "object" &&
            "is_bookmarked" in response
          ) {
            const actualIsBookmarkState = response.is_bookmarked ?? false;
            const actualBookmarksCount = response.bookmarks_count || 0;

            // 実際の状態に基づいて更新
            const correctedPosts = updatePostsWithActualState(
              posts,
              originalPostId,
              "bookmark",
              actualIsBookmarkState,
              actualBookmarksCount
            );
            setPosts(correctedPosts);
            setTabCache((prev) => ({
              ...prev,
              [activeTab]: {
                ...prev[activeTab],
                posts: correctedPosts,
                lastUpdated: Date.now(),
              },
            }));
          }
        }
      }

      // 成功時のトースト表示
      const actionName =
        actionType === "like"
          ? "いいね"
          : actionType === "spark"
          ? "スパーク"
          : "ブックマーク";
      toast({
        title: isCurrentlyActive
          ? `${actionName}を取り消しました`
          : `${actionName}しました`,
      });
    } catch (error) {
      // 4. エラー発生時はUIを元の状態に戻す
      console.error(`${actionType} action failed:`, error);
      setPosts(posts); // 元の状態に戻す

      // キャッシュもロールバック
      setTabCache((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          posts: posts,
          lastUpdated: Date.now(),
        },
      }));

      // エラーメッセージを表示
      let errorMessage = "操作に失敗しました";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // 処理完了をマーク
      setProcessingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleRefresh = () => loadPosts(undefined, true);
  const handleLoadMore = () => {
    if (nextCursor && !loading) loadPosts(nextCursor);
  };

  const handleQuote = (post: Post) => {
    // 引用投稿モーダルを表示
    setQuotedPost(post);
    setShowQuoteModal(true);
    console.log("Quote post:", post.id);
  };

  const handleQuotePostCreated = (newPost: Post) => {
    // 新しい投稿をリストの先頭に追加
    setPosts((prev) => [newPost, ...prev]);
    setShowQuoteModal(false);
    setQuotedPost(undefined);
  };

  const handleDeletePost = (postId: string) => {
    // 投稿をリストから削除
    setPosts((prev) => prev.filter((post) => post.id !== postId));

    // キャッシュからも削除
    setTabCache((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        posts:
          prev[activeTab]?.posts?.filter((post) => post.id !== postId) || [],
        lastUpdated: Date.now(),
      },
    }));

    toast({
      title: "投稿を削除しました",
    });
  };

  // 投稿をタブでフィルタリング（APIで処理されるため削除）

  if (loading && posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* タブナビゲーション */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40 -mx-4 px-4 mb-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant="ghost"
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-none border-b-2 transition-all duration-200 ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600 bg-blue-50"
                      : "border-transparent hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* ローディング表示 */}
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  // ショートタブの場合は専用コンポーネントを表示
  if (activeTab === "short") {
    return <ShortVideoFeed activeTab={activeTab} onTabChange={setActiveTab} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex justify-center">
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "更新中..." : "更新"}
        </Button>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 -mx-4 px-4 mb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <Button
                key={tab.key}
                variant="ghost"
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-none border-b-2 transition-all duration-200 ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {posts.length === 0
              ? "投稿がありません"
              : `${
                  tabs.find((t) => t.key === activeTab)?.label || "この条件"
                }に該当する投稿がありません`}
          </div>
        ) : (
          posts.map((post, index) => (
            <PostCard
              key={`${activeTab}-${post.id}-${index}`}
              post={post}
              onQuote={handleQuote}
              onToggleAction={handleToggleAction}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                読み込み中...
              </>
            ) : (
              "もっと見る"
            )}
          </Button>
        </div>
      )}

      {/* 引用投稿モーダル */}
      <PostCreateModal
        isOpen={showQuoteModal}
        onClose={() => {
          setShowQuoteModal(false);
          setQuotedPost(undefined);
        }}
        onPostCreated={handleQuotePostCreated}
        quotedPost={quotedPost}
      />
    </div>
  );
}
