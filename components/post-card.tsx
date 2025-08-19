"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Post } from "@/lib/post-api";
import { Comment, commentApi } from "@/lib/comment-api";
import {
  Heart,
  Zap,
  Bookmark,
  MessageCircle,
  Share2,
  MoreVertical,
  Eye,
  Globe,
  Users,
  UserCheck,
  Lock,
  DollarSign,
  Play,
  X,
  Trash2,
  Edit,
  Repeat,
  Reply,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import ImageModal from "@/components/image-modal";
import CommentItem from "@/components/comment-item";
import CommentForm from "@/components/comment-form";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface PostCardProps {
  post: Post;
  onQuote?: (post: Post) => void;
  onToggleAction: (
    postId: string,
    actionType: "like" | "spark" | "bookmark"
  ) => void;
  onDelete?: (postId: string) => void;
}

export default function PostCard({
  post,
  onQuote,
  onToggleAction,
  onDelete,
}: PostCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSensitiveContent, setShowSensitiveContent] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // コメント関連の状態
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // デバッグ用：コメント引用投稿の構造をログ出力
  if (post.quoted_reply_id) {
    console.log("Comment quote post detected:", {
      postId: post.id,
      quoted_reply_id: post.quoted_reply_id,
      quoted_reply: post.quoted_reply,
      quoted_post_id: post.quoted_post_id,
      quoted_post: post.quoted_post,
    });
  }
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  const formatRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ja });
  };

  // ユーザーの年齢を計算する関数
  const calculateAge = (birthday: string): number => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // ユーザーが18歳以上かチェック
  const isAdult = (): boolean => {
    if (!currentUser?.birthday) return false;
    return calculateAge(currentUser.birthday) >= 18;
  };

  // センシティブコンテンツを表示できるかチェック
  const canViewSensitiveContent = (): boolean => {
    if (!post.is_sensitive) return true;
    if (!currentUser) return false;
    return isAdult();
  };

  const openImageModal = (images: string[], index: number) => {
    setModalImages(images);
    setModalIndex(index);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
  };

  // ログイン必須の操作をチェックする関数
  const requireAuth = (action: string): boolean => {
    if (!currentUser) {
      // ログインが必要なアクションの場合、ログインページにリダイレクト
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}&action=${action}`
      );
      return false;
    }
    return true;
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleEdit = () => {
    // TODO: 編集機能を実装
    console.log("Edit post:", post.id);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!currentUser || currentUser.id !== post.user.id || isDeleting) return;

    try {
      setIsDeleting(true);
      // APIクライアントを使用してバックエンドの削除エンドポイントを呼び出す
      await api.delete(`/posts/${post.id}`);

      // 削除成功時のコールバック
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error("削除エラー:", error);
      // TODO: エラートーストを表示
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // 動画プレビューコンポーネント
  const renderVideoPreview = (
    media: { id: string; file_path: string; file_type: string },
    isShort: boolean = false
  ) => {
    const aspectClass = isShort ? "aspect-[9/16]" : "aspect-video";
    const videoKey = `${media.id}-${media.file_path}`;

    return (
      <div
        className={`relative group ${aspectClass} rounded-lg overflow-hidden bg-black cursor-pointer`}
      >
        <video
          ref={(el) => {
            if (el) videoRefs.current[videoKey] = el;
          }}
          src={media.file_path}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          onMouseEnter={() => {
            const video = videoRefs.current[videoKey];
            if (video) {
              video.currentTime = 0;
              video.play().catch(() => {
                // 自動再生が失敗した場合は無視
              });
            }
          }}
          onMouseLeave={() => {
            const video = videoRefs.current[videoKey];
            if (video) {
              video.pause();
              video.currentTime = 0;
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            setExpandedVideo(media.file_path);
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black bg-opacity-50 rounded-full p-3 group-hover:bg-opacity-70 transition-all">
            <Play className="w-6 h-6 text-white" fill="white" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {isShort ? "ショート" : "動画"}
        </div>
      </div>
    );
  };

  // 公開範囲のアイコンとテキストを取得
  const getViewPermissionInfo = (permission: string) => {
    switch (permission) {
      case "public":
        return { icon: Globe, text: "全員", color: "text-green-600" };
      case "followers":
        return { icon: Users, text: "フォロワー", color: "text-blue-600" };
      case "mutuals":
        return {
          icon: UserCheck,
          text: "相互フォロー",
          color: "text-purple-600",
        };
      default:
        return { icon: Lock, text: "限定", color: "text-gray-600" };
    }
  };

  // コメントスパークかどうかを判定
  const isCommentSpark = (post: Post) => {
    return (
      post.content_type === "quote" &&
      post.text_content?.includes("さんのコメントを共有しました")
    );
  };

  // コメント読み込み
  const loadComments = async () => {
    if (commentsLoading) return;

    setCommentsLoading(true);
    setApiError(null);

    try {
      const commentsResponse = await commentApi.getComments(post.id);
      setComments(commentsResponse);
    } catch (error) {
      console.warn("Failed to load comments:", error);
      setApiError("コメントの読み込みに失敗しました");
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // コメント表示切り替え
  const handleToggleComments = async () => {
    const newShowComments = !showComments;
    setShowComments(newShowComments);

    if (newShowComments && comments.length === 0) {
      await loadComments();
    }
  };

  // コメント送信
  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast({ title: "コメントを入力してください", variant: "destructive" });
      return;
    }

    if (commentText.length > 100) {
      toast({
        title: "コメントは100文字以内で入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      if (apiError || !currentUser) {
        // デモモード: ダミーコメントを作成
        const demoComment: Comment = {
          id: `demo-comment-${Date.now()}`,
          post_id: post.id,
          user_id: currentUser?.id?.toString() || "current-user",
          content: commentText,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: currentUser?.id || 999,
            name: currentUser?.name || "現在のユーザー",
            username: currentUser?.username || undefined,
            profile_image: currentUser?.profile_image || undefined,
          },
        };

        setComments([demoComment, ...comments]);
        setCommentText("");

        toast({
          title: apiError
            ? "コメントを投稿しました（デモモード）"
            : "コメントを投稿しました（ログイン後に実際に投稿されます）",
          variant: "default",
        });
      } else {
        // 実際のAPI呼び出し
        const newComment = await commentApi.createComment(post.id, commentText);
        setComments([newComment, ...comments]);
        setCommentText("");

        toast({
          title: "コメントを投稿しました",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to create comment:", error);
      toast({
        title: "エラー",
        description: "コメントの投稿に失敗しました",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 返信送信
  const handleSubmitReply = async (parentCommentId: string, text: string) => {
    if (!text.trim()) {
      toast({ title: "返信を入力してください", variant: "destructive" });
      return;
    }

    if (text.length > 100) {
      toast({
        title: "返信は100文字以内で入力してください",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      if (apiError || !currentUser) {
        // デモモード: ダミー返信を作成
        const demoReply: Comment = {
          id: `demo-reply-${Date.now()}`,
          post_id: post.id,
          user_id: currentUser?.id?.toString() || "current-user",
          content: text,
          parent_id: parentCommentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: currentUser?.id || 999,
            name: currentUser?.name || "現在のユーザー",
            username: currentUser?.username || undefined,
            profile_image: currentUser?.profile_image || undefined,
          },
        };

        // コメントリストを更新（返信を親コメントの下に挿入）
        const addReplyToTree = (
          comments: Comment[],
          targetId: string,
          reply: Comment
        ): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === targetId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), reply],
              };
            } else if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: addReplyToTree(comment.replies, targetId, reply),
              };
            }
            return comment;
          });
        };

        const updatedComments = addReplyToTree(
          comments,
          parentCommentId,
          demoReply
        );

        setComments(updatedComments);
        setReplyingTo(null);

        toast({
          title: apiError
            ? "返信を投稿しました（デモモード）"
            : "返信を投稿しました（ログイン後に実際に投稿されます）",
          variant: "default",
        });
      } else {
        // 実際のAPI呼び出し
        const newReply = await commentApi.createReply(parentCommentId, text);

        // コメントリストを更新（返信を親コメントの下に挿入）
        const addReplyToTree = (
          comments: Comment[],
          targetId: string,
          reply: Comment
        ): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === targetId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), reply],
              };
            } else if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: addReplyToTree(comment.replies, targetId, reply),
              };
            }
            return comment;
          });
        };

        const updatedComments = addReplyToTree(
          comments,
          parentCommentId,
          newReply
        );

        setComments(updatedComments);
        setReplyingTo(null);

        toast({
          title: "返信を投稿しました",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Failed to create reply:", error);
      toast({
        title: "エラー",
        description: "返信の投稿に失敗しました",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // コメントのいいね機能
  const handleCommentLike = async (commentId: string) => {
    if (!currentUser && !apiError) {
      toast({ title: "ログインが必要です", variant: "destructive" });
      return;
    }

    // 現在のコメントの状態を取得
    const findComment = (comments: Comment[], id: string): Comment | null => {
      for (const comment of comments) {
        if (comment.id === id) return comment;
        if (comment.replies) {
          const found = findComment(comment.replies, id);
          if (found) return found;
        }
      }
      return null;
    };

    const comment = findComment(comments, commentId);
    if (!comment) return;

    const wasLiked = comment.is_liked || false;

    // オプティミスティック更新
    const updateCommentInTree = (comments: Comment[]): Comment[] => {
      return comments.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            is_liked: !wasLiked,
            likes_count: wasLiked
              ? Math.max(0, (c.likes_count || 0) - 1)
              : (c.likes_count || 0) + 1,
          };
        }
        if (c.replies) {
          return {
            ...c,
            replies: updateCommentInTree(c.replies),
          };
        }
        return c;
      });
    };

    // UIを即座に更新
    const originalComments = comments;
    setComments(updateCommentInTree);

    // デモモードまたはAPIエラーの場合はローカルでのみ動作
    if (apiError || !currentUser) {
      toast({
        title: wasLiked
          ? "いいねを取り消しました（デモモード）"
          : "いいねしました（デモモード）",
        variant: "default",
      });
      return;
    }

    try {
      if (wasLiked) {
        await commentApi.unlikeComment(commentId);
      } else {
        await commentApi.likeComment(commentId);
      }

      toast({
        title: wasLiked ? "いいねを取り消しました" : "いいねしました",
        variant: "default",
      });
    } catch (error) {
      // エラー時は元に戻す
      console.error("Comment like failed:", error);
      setComments(originalComments);
      toast({
        title: "エラー",
        description: "いいねの操作に失敗しました",
        variant: "destructive",
      });
    }
  };

  const handlePostClick = (e: React.MouseEvent) => {
    // インタラクティブな要素をクリックした場合は投稿遷移を防ぐ
    const target = e.target as HTMLElement;
    const isInteractiveElement = target.closest(
      'button, a, [role="button"], .interactive-element, video, [data-radix-collection-item]'
    );

    if (!isInteractiveElement) {
      // 自分の投稿の場合は常に詳細ページに遷移可能
      const isOwnPost = currentUser && currentUser.id === post.user.id;

      // 公開範囲チェック：自分の投稿または公開投稿は詳細表示可能
      const canViewDetail =
        isOwnPost ||
        post.view_permission === "public" ||
        (post.view_permission === "followers" && currentUser) ||
        (post.view_permission === "mutuals" && currentUser);

      if (canViewDetail) {
        router.push(`/posts/${post.id}`);
      }
    }
  };

  return (
    <Card
      className="mb-4 cursor-pointer hover:bg-gray-50 transition-colors max-w-full overflow-hidden"
      onClick={handlePostClick}
    >
      {/* リポスト表示（コメントスパークも含む） */}
      {((post.is_repost && post.repost_user) || isCommentSpark(post)) && (
        <div className="px-3 sm:px-4 pt-2 pb-1">
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <Repeat className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-yellow-500" />
            <span>
              <span className="font-medium">
                {post.is_repost && post.repost_user
                  ? post.repost_user.name
                  : post.user.name}
              </span>
              が共有しました
            </span>
          </div>
        </div>
      )}

      <CardHeader className="pb-2 px-3 sm:px-6 ">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="flex-shrink-0 pt-1">
              <Avatar
                className="w-8 h-8 sm:w-10 sm:h-10 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProfileClick(post.user.id.toString());
                }}
              >
                <AvatarImage src={post.user.profile_image || undefined} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {post.user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="font-semibold text-xs sm:text-sm truncate">
                  {post.user.name || post.user.username}
                </span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {formatRelativeTime(post.created_at)}
                </span>
              </div>
              {post.user.username && (
                <div className="text-muted-foreground text-xs truncate">
                  @{post.user.username}
                </div>
              )}
              {/* 投稿メタ情報の表示 */}
              <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                {/* 公開範囲 */}
                {(() => {
                  const permissionInfo = getViewPermissionInfo(
                    post.view_permission
                  );
                  const PermissionIcon = permissionInfo.icon;
                  return (
                    <div
                      className={`flex items-center space-x-1 ${permissionInfo.color}`}
                    >
                      <PermissionIcon className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span className="text-xs">{permissionInfo.text}</span>
                    </div>
                  );
                })()}

                {/* 有料投稿の場合 */}
                {post.is_paid && (
                  <>
                    <span className="text-muted-foreground text-xs">·</span>
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <DollarSign className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span className="text-xs">有料</span>
                    </div>
                  </>
                )}

                {/* 引用投稿の場合 */}
                {post.content_type === "quote" && (
                  <>
                    <span className="text-muted-foreground text-xs">·</span>
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Share2 className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span className="text-xs">引用</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {currentUser && currentUser.id === post.user.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 interactive-element"
                >
                  <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  編集
                </DropdownMenuItem> */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="ml-10 sm:ml-12">
          {" "}
          {/* プロフィール画像分のインデント */}
          {/* センシティブコンテンツの制御 */}
          {post.is_sensitive && !canViewSensitiveContent() ? (
            // 18歳未満の場合は表示しない
            <div className="text-center p-4 sm:p-6 bg-gray-100 rounded-lg mb-3">
              <p className="text-xs sm:text-sm text-gray-600">
                このコンテンツは18歳以上のユーザーのみ閲覧可能です。
              </p>
            </div>
          ) : post.is_sensitive && !showSensitiveContent ? (
            // 18歳以上でセンシティブコンテンツの場合は警告表示
            <div className="text-center p-4 sm:p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
              <div className="mb-3">
                <p className="text-xs sm:text-sm font-medium text-yellow-800 mb-1">
                  センシティブなコンテンツです
                </p>
                <p className="text-xs text-yellow-700">
                  この投稿には不適切な内容が含まれている可能性があります
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSensitiveContent(true)}
                className="bg-white hover:bg-yellow-50 text-xs px-3 py-1"
              >
                表示する
              </Button>
            </div>
          ) : (
            // 通常のコンテンツまたはセンシティブコンテンツを表示許可済み
            <>
              {/* コメントスパークの場合はテキストコンテンツを非表示 */}
              {!isCommentSpark(post) && (
                <p className="text-xs sm:text-sm leading-relaxed mb-3 break-words">
                  {post.text_content}
                </p>
              )}

              {/* メディアの表示 */}
              {post.media && post.media.length > 0 && (
                <div className="mt-3 max-w-full overflow-hidden">
                  {/* 動画の場合は全幅表示、画像の場合はグリッド表示 */}
                  {post.content_type === "video" ||
                  post.content_type === "short_video" ? (
                    // 動画投稿の場合
                    <div className="w-full max-w-full">
                      {post.media
                        .filter((media) => media.file_type.startsWith("video/"))
                        .slice(0, 1)
                        .map((media) => (
                          <div key={media.id} className="max-w-full">
                            {renderVideoPreview(
                              media,
                              post.content_type === "short_video"
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    // テキスト投稿の画像の場合
                    <div className="grid gap-1 sm:gap-2 grid-cols-2 max-w-full">
                      {post.media.slice(0, 4).map((media) => (
                        <div
                          key={media.id}
                          className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity min-w-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              media.file_type.startsWith("image/") &&
                              post.media
                            ) {
                              const imageMedia = post.media.filter((m) =>
                                m.file_type.startsWith("image/")
                              );
                              const imageUrls = imageMedia.map(
                                (m) => m.file_path
                              );
                              const imageIndex = imageMedia.findIndex(
                                (m) => m.id === media.id
                              );
                              if (imageIndex !== -1) {
                                openImageModal(imageUrls, imageIndex);
                              }
                            } else if (media.file_type.startsWith("video/")) {
                              setExpandedVideo(media.file_path);
                            }
                          }}
                        >
                          {media.file_type.startsWith("image/") && (
                            <Image
                              src={media.file_path}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          )}
                          {media.file_type.startsWith("video/") &&
                            renderVideoPreview(media, false)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {/* 引用投稿の表示 */}
          {(!post.is_sensitive || canViewSensitiveContent()) &&
            post.quoted_post && (
              <div
                className="border rounded-lg p-2 sm:p-3 mb-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors interactive-element"
                onClick={(e) => {
                  e.stopPropagation();
                  // メディアクリック時は投稿遷移を防ぐ
                  if ((e.target as HTMLElement).closest(".media-container")) {
                    return;
                  }
                  router.push(`/posts/${post.quoted_post?.id}`);
                }}
              >
                <div className="flex items-start space-x-2 mb-2">
                  <Avatar
                    className="w-5 h-5 sm:w-6 sm:h-6 border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      post.quoted_post &&
                        handleProfileClick(post.quoted_post.user.id.toString());
                    }}
                  >
                    <AvatarImage
                      src={post.quoted_post.user.profile_image || undefined}
                    />
                    <AvatarFallback className="text-xs">
                      {post.quoted_post.user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="text-xs sm:text-sm font-medium truncate">
                        {post.quoted_post.user.name ||
                          post.quoted_post.user.username}
                      </span>
                      <span className="text-xs text-gray-500">·</span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(post.quoted_post.created_at)}
                      </span>
                    </div>
                    {post.quoted_post.user.username && (
                      <div className="text-xs text-gray-500 truncate">
                        @{post.quoted_post.user.username}
                      </div>
                    )}
                  </div>
                </div>
                {post.quoted_post.text_content && (
                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {post.quoted_post.text_content}
                  </p>
                )}
                {/* 引用投稿のメディア表示 */}
                {post.quoted_post.media &&
                  post.quoted_post.media.length > 0 && (
                    <div
                      className="mt-2 media-container max-w-full overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 引用投稿でも動画の場合は全幅表示 */}
                      {post.quoted_post.content_type === "video" ||
                      post.quoted_post.content_type === "short_video" ? (
                        <div className="w-full max-w-full">
                          {post.quoted_post.media
                            .filter((media) =>
                              media.file_type.startsWith("video/")
                            )
                            .slice(0, 1)
                            .map((media) => (
                              <div key={media.id} className="max-w-full">
                                {renderVideoPreview(
                                  media,
                                  post.quoted_post?.content_type ===
                                    "short_video"
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="grid gap-1 sm:gap-2 grid-cols-2 max-w-full">
                          {post.quoted_post.media.slice(0, 4).map((media) => (
                            <div
                              key={media.id}
                              className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity min-w-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  media.file_type.startsWith("image/") &&
                                  post.quoted_post?.media
                                ) {
                                  const imageMedia =
                                    post.quoted_post.media.filter((m) =>
                                      m.file_type.startsWith("image/")
                                    );
                                  const imageUrls = imageMedia.map(
                                    (m) => m.file_path
                                  );
                                  const imageIndex = imageMedia.findIndex(
                                    (m) => m.id === media.id
                                  );
                                  if (imageIndex !== -1) {
                                    openImageModal(imageUrls, imageIndex);
                                  }
                                } else if (
                                  media.file_type.startsWith("video/")
                                ) {
                                  setExpandedVideo(media.file_path);
                                }
                              }}
                            >
                              {media.file_type.startsWith("image/") && (
                                <Image
                                  src={media.file_path}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              )}
                              {media.file_type.startsWith("video/") &&
                                renderVideoPreview(
                                  media,
                                  post.quoted_post?.content_type ===
                                    "short_video"
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                      {post.quoted_post.media.length > 4 && (
                        <div className="text-xs text-gray-500 mt-1">
                          +{post.quoted_post.media.length - 4} その他
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}
          {/* 引用コメントの表示 */}
          {(!post.is_sensitive || canViewSensitiveContent()) &&
            post.quoted_reply && (
              <div className="space-y-2 sm:space-y-3 mb-3">
                {/* 引用コメント */}
                <div className="border rounded-lg p-2 sm:p-3 bg-blue-50">
                  <div className="text-xs text-gray-600 mb-2">
                    引用コメント:
                  </div>
                  <div className="flex items-start space-x-2">
                    <Avatar
                      className="w-5 h-5 sm:w-6 sm:h-6 border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        post.quoted_reply &&
                          handleProfileClick(
                            post.quoted_reply.user.id.toString()
                          );
                      }}
                    >
                      <AvatarImage
                        src={post.quoted_reply.user.profile_image || undefined}
                      />
                      <AvatarFallback className="text-xs">
                        {post.quoted_reply.user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium">
                        {post.quoted_reply.user.name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-700 mt-1 break-words">
                        {post.quoted_reply.content}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 元の投稿 */}
                {post.quoted_reply.post && (
                  <div
                    className="border rounded-lg p-2 sm:p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors interactive-element"
                    onClick={(e) => {
                      e.stopPropagation();
                      post.quoted_reply?.post &&
                        router.push(`/posts/${post.quoted_reply.post.id}`);
                    }}
                  >
                    <div className="text-xs text-gray-600 mb-2">元の投稿:</div>
                    <div className="flex items-start space-x-2">
                      <Avatar
                        className="w-5 h-5 sm:w-6 sm:h-6 border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          post.quoted_reply?.post &&
                            handleProfileClick(
                              post.quoted_reply.post.user.id.toString()
                            );
                        }}
                      >
                        <AvatarImage
                          src={
                            post.quoted_reply.post.user.profile_image ||
                            undefined
                          }
                        />
                        <AvatarFallback className="text-xs">
                          {post.quoted_reply.post.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium">
                          {post.quoted_reply.post.user.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-700 mt-1 break-words">
                          {post.quoted_reply.post.text_content}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          <Separator className="my-2 sm:my-3" />
          {/* モバイル用のコンパクトなアクションバー */}
          <div className="block sm:hidden">
            <div className="flex items-center justify-between interactive-element">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-2 ${
                    post.is_liked
                      ? "text-red-500 hover:text-red-600"
                      : "text-muted-foreground hover:text-red-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (requireAuth("like")) {
                      onToggleAction(post.id, "like");
                    }
                  }}
                >
                  <Heart
                    className={`w-4 h-4 ${post.is_liked ? "fill-current" : ""}`}
                  />
                  <span className="ml-1 text-xs">{post.likes_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-2 ${
                    post.is_sparked
                      ? "text-yellow-500 hover:text-yellow-600"
                      : "text-muted-foreground hover:text-yellow-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (requireAuth("spark")) {
                      onToggleAction(post.id, "spark");
                    }
                  }}
                >
                  <Repeat
                    className={`w-4 h-4 ${
                      post.is_sparked ? "fill-current" : ""
                    }`}
                  />
                  <span className="ml-1 text-xs">{post.sparks_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-2 transition-colors ${
                    showComments
                      ? "text-blue-500 hover:text-blue-600"
                      : "text-muted-foreground hover:text-blue-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (requireAuth("comment")) {
                      handleToggleComments();
                    }
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="ml-1 text-xs">{post.replies_count}</span>
                  {/*{showComments ? (
                    <ChevronUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-1" />
                  )} */}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 text-muted-foreground hover:text-green-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (requireAuth("quote")) {
                      onQuote?.(post);
                    }
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="ml-1 text-xs">{post.quotes_count}</span>
                </Button>
              </div>

              <div className="flex items-center space-x-1">
                <div className="flex items-center text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span className="ml-1 text-xs">{post.views_count || 0}</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-2 ${
                    post.is_bookmarked
                      ? "text-blue-500 hover:text-blue-600"
                      : "text-muted-foreground hover:text-blue-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (requireAuth("bookmark")) {
                      onToggleAction(post.id, "bookmark");
                    }
                  }}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      post.is_bookmarked ? "fill-current" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
          {/* デスクトップ用のアクションバー */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between interactive-element">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-1 ${
                    post.is_liked
                      ? "text-red-500 hover:text-red-600"
                      : "text-muted-foreground hover:text-red-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (requireAuth("like")) {
                      onToggleAction(post.id, "like");
                    }
                  }}
                >
                  <Heart
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      post.is_liked ? "fill-current" : ""
                    }`}
                  />
                  <span className="ml-1 text-xs">{post.likes_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-1 ${
                    post.is_sparked
                      ? "text-yellow-500 hover:text-yellow-600"
                      : "text-muted-foreground hover:text-yellow-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (requireAuth("spark")) {
                      onToggleAction(post.id, "spark");
                    }
                  }}
                >
                  <Repeat
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      post.is_sparked ? "fill-current" : ""
                    }`}
                  />
                  <span className="ml-1 text-xs">{post.sparks_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-auto p-1 transition-colors ${
                    showComments
                      ? "text-blue-500 hover:text-blue-600"
                      : "text-muted-foreground hover:text-blue-500"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (requireAuth("comment")) {
                      handleToggleComments();
                    }
                  }}
                >
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="ml-1 text-xs">{post.replies_count}</span>
                  {/* {showComments ? (
                    <ChevronUp className="w-2 h-2 sm:w-3 sm:h-3 ml-1" />
                  ) : (
                    <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3 ml-1" />
                  )} */}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-muted-foreground hover:text-green-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (requireAuth("quote")) {
                      onQuote?.(post);
                    }
                  }}
                >
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="ml-1 text-xs">{post.quotes_count}</span>
                </Button>

                <div className="flex items-center text-muted-foreground">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="ml-1 text-xs">{post.views_count || 0}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className={`h-auto p-1 ${
                  post.is_bookmarked
                    ? "text-blue-500 hover:text-blue-600"
                    : "text-muted-foreground hover:text-blue-500"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (requireAuth("bookmark")) {
                    onToggleAction(post.id, "bookmark");
                  }
                }}
              >
                <Bookmark
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${
                    post.is_bookmarked ? "fill-current" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
          {/* コメントセクション */}
          {showComments && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 interactive-element max-w-full overflow-hidden">
              {/* コメント入力フォーム */}
              <div className="mb-3 sm:mb-4 max-w-full">
                <CommentForm
                  currentUser={currentUser}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  onSubmit={handleSubmitComment}
                  submitting={submitting}
                />
              </div>

              {/* コメント一覧 */}
              <div className="space-y-3 sm:space-y-4 max-w-full overflow-hidden">
                {commentsLoading ? (
                  <div className="text-center py-4 text-gray-500">
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mx-auto mb-2" />
                    <p className="text-xs sm:text-sm">
                      コメントを読み込み中...
                    </p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-4 sm:py-6 text-gray-500">
                    <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs sm:text-sm">
                      まだコメントがありません
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      最初のコメントを投稿してみましょう
                    </p>
                  </div>
                ) : (
                  comments.map((comment: Comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onReply={handleSubmitReply}
                      onLike={handleCommentLike}
                      replyingTo={replyingTo}
                      setReplyingTo={setReplyingTo}
                      currentUser={currentUser}
                      submitting={submitting}
                    />
                  ))
                )}

                {apiError && (
                  <div className="text-center py-4 text-gray-500">
                    <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs sm:text-sm">
                      コメント機能はデモモードです
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      APIが利用可能になると実際のコメントが表示されます
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>{" "}
        {/* インデントdivの閉じタグ */}
      </CardContent>

      {/* 画像モーダル */}
      <ImageModal
        images={modalImages}
        initialIndex={modalIndex}
        isOpen={isModalOpen}
        onClose={closeImageModal}
      />

      {/* 動画拡大モーダル */}
      {expandedVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setExpandedVideo(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-white"
              onClick={() => setExpandedVideo(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            <video
              src={expandedVideo}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>投稿を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消すことができません。投稿とそれに関連するすべてのデータが完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
