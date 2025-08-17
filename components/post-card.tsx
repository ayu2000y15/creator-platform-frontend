"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Heart,
  Zap,
  Bookmark,
  MessageCircle,
  Share2,
  MoreVertical,
  Globe,
  Users,
  UserCheck,
  Lock,
  DollarSign,
  Play,
  X,
  Trash2,
  Edit,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import ImageModal from "@/components/image-modal";
import { useAuth } from "@/contexts/auth-context";
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
  const router = useRouter();
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSensitiveContent, setShowSensitiveContent] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
          onClick={() => {
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
      post.text_content?.includes("さんのコメントをスパークしました")
    );
  };

  return (
    <Card className="mb-4">
      {/* リポスト表示（コメントスパークも含む） */}
      {((post.is_repost && post.repost_user) || isCommentSpark(post)) && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center text-sm text-muted-foreground">
            <Zap className="w-4 h-4 mr-2 text-yellow-500" />
            <span>
              <span className="font-medium">
                {post.is_repost && post.repost_user
                  ? post.repost_user.name
                  : post.user.name}
              </span>
              がスパークしました
            </span>
          </div>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 pt-1">
              <Avatar
                className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleProfileClick(post.user.id.toString())}
              >
                <AvatarImage src={post.user.profile_image || undefined} />
                <AvatarFallback>
                  {post.user.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm truncate">
                  {post.user.name || post.user.username}
                </span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatRelativeTime(post.created_at)}
                </span>
              </div>
              {post.user.username && (
                <div className="text-muted-foreground text-xs truncate">
                  @{post.user.username}
                </div>
              )}
              {/* 投稿メタ情報の表示 */}
              <div className="flex items-center space-x-2 mt-1">
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
                      <PermissionIcon className="w-3 h-3" />
                      <span className="text-xs">{permissionInfo.text}</span>
                    </div>
                  );
                })()}

                {/* 有料投稿の場合 */}
                {post.is_paid && (
                  <>
                    <span className="text-muted-foreground text-xs">·</span>
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <DollarSign className="w-3 h-3" />
                      <span className="text-xs">有料</span>
                    </div>
                  </>
                )}

                {/* 引用投稿の場合 */}
                {post.content_type === "quote" && (
                  <>
                    <span className="text-muted-foreground text-xs">·</span>
                    <div className="flex items-center space-x-1 text-blue-600">
                      <Share2 className="w-3 h-3" />
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
                <Button variant="ghost" size="sm" className="h-auto p-1">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit()}>
                  <Edit className="w-4 h-4 mr-2" />
                  編集
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete()}
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

      <CardContent className="pt-0">
        <div className="ml-12">
          {" "}
          {/* プロフィール画像分のインデント (w-10 + space-x-3) */}
          {/* センシティブコンテンツの制御 */}
          {post.is_sensitive && !canViewSensitiveContent() ? (
            // 18歳未満の場合は表示しない
            <div className="text-center p-6 bg-gray-100 rounded-lg mb-3">
              <p className="text-sm text-gray-600">
                このコンテンツは18歳以上のユーザーのみ閲覧可能です。
              </p>
            </div>
          ) : post.is_sensitive && !showSensitiveContent ? (
            // 18歳以上でセンシティブコンテンツの場合は警告表示
            <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
              <div className="mb-3">
                <p className="text-sm font-medium text-yellow-800 mb-1">
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
                className="bg-white hover:bg-yellow-50"
              >
                表示する
              </Button>
            </div>
          ) : (
            // 通常のコンテンツまたはセンシティブコンテンツを表示許可済み
            <>
              {/* コメントスパークの場合はテキストコンテンツを非表示 */}
              {!isCommentSpark(post) && (
                <p className="text-sm leading-relaxed mb-3">
                  {post.text_content}
                </p>
              )}

              {/* メディアの表示 */}
              {post.media && post.media.length > 0 && (
                <div className="mt-3">
                  {/* 動画の場合は全幅表示、画像の場合はグリッド表示 */}
                  {post.content_type === "video" ||
                  post.content_type === "short_video" ? (
                    // 動画投稿の場合
                    <div className="w-full">
                      {post.media
                        .filter((media) => media.file_type.startsWith("video/"))
                        .slice(0, 1)
                        .map((media) => (
                          <div key={media.id}>
                            {renderVideoPreview(
                              media,
                              post.content_type === "short_video"
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    // テキスト投稿の画像の場合
                    <div className="grid gap-2 grid-cols-2">
                      {post.media.slice(0, 4).map((media) => (
                        <div
                          key={media.id}
                          className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
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
                className="border rounded-lg p-3 mb-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                  // メディアクリック時は投稿遷移を防ぐ
                  if ((e.target as HTMLElement).closest(".media-container")) {
                    return;
                  }
                  router.push(`/posts/${post.quoted_post?.id}`);
                }}
              >
                <div className="flex items-start space-x-2 mb-2">
                  <Avatar
                    className="w-6 h-6 border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() =>
                      post.quoted_post &&
                      handleProfileClick(post.quoted_post.user.id.toString())
                    }
                  >
                    <AvatarImage
                      src={post.quoted_post.user.profile_image || undefined}
                    />
                    <AvatarFallback>
                      {post.quoted_post.user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium truncate">
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
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {post.quoted_post.text_content}
                  </p>
                )}
                {/* 引用投稿のメディア表示 */}
                {post.quoted_post.media &&
                  post.quoted_post.media.length > 0 && (
                    <div
                      className="mt-2 media-container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 引用投稿でも動画の場合は全幅表示 */}
                      {post.quoted_post.content_type === "video" ||
                      post.quoted_post.content_type === "short_video" ? (
                        <div className="w-full">
                          {post.quoted_post.media
                            .filter((media) =>
                              media.file_type.startsWith("video/")
                            )
                            .slice(0, 1)
                            .map((media) => (
                              <div key={media.id}>
                                {renderVideoPreview(
                                  media,
                                  post.quoted_post?.content_type ===
                                    "short_video"
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="grid gap-2 grid-cols-2">
                          {post.quoted_post.media.slice(0, 4).map((media) => (
                            <div
                              key={media.id}
                              className="relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
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
              <div className="space-y-3 mb-3">
                {/* 引用コメント */}
                <div className="border rounded-lg p-3 bg-blue-50">
                  <div className="text-xs text-gray-600 mb-2">
                    引用コメント:
                  </div>
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-6 h-6 border border-gray-300">
                      <AvatarImage
                        src={post.quoted_reply.user.profile_image || undefined}
                      />
                      <AvatarFallback>
                        {post.quoted_reply.user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {post.quoted_reply.user.name}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        {post.quoted_reply.content}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 元の投稿 */}
                {post.quoted_reply.post && (
                  <div
                    className="border rounded-lg p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() =>
                      post.quoted_reply?.post &&
                      router.push(`/posts/${post.quoted_reply.post.id}`)
                    }
                  >
                    <div className="text-xs text-gray-600 mb-2">元の投稿:</div>
                    <div className="flex items-start space-x-2">
                      <Avatar className="w-6 h-6 border border-gray-300">
                        <AvatarImage
                          src={
                            post.quoted_reply.post.user.profile_image ||
                            undefined
                          }
                        />
                        <AvatarFallback>
                          {post.quoted_reply.post.user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {post.quoted_reply.post.user.name}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {post.quoted_reply.post.text_content}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                className={`h-auto p-1 ${
                  post.is_liked
                    ? "text-red-500 hover:text-red-600"
                    : "text-muted-foreground hover:text-red-500"
                }`}
                onClick={() => {
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
                className={`h-auto p-1 ${
                  post.is_sparked
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-muted-foreground hover:text-yellow-500"
                }`}
                onClick={() => {
                  if (requireAuth("spark")) {
                    onToggleAction(post.id, "spark");
                  }
                }}
              >
                <Zap
                  className={`w-4 h-4 ${post.is_sparked ? "fill-current" : ""}`}
                />
                <span className="ml-1 text-xs">{post.sparks_count}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-muted-foreground hover:text-blue-500"
                onClick={() => {
                  if (requireAuth("comment")) {
                    router.push(`/posts/${post.id}`);
                  }
                }}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="ml-1 text-xs">{post.replies_count}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-muted-foreground hover:text-green-500"
                onClick={() => {
                  if (requireAuth("quote")) {
                    onQuote?.(post);
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                <span className="ml-1 text-xs">{post.quotes_count}</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className={`h-auto p-1 ${
                post.is_bookmarked
                  ? "text-blue-500 hover:text-blue-600"
                  : "text-muted-foreground hover:text-blue-500"
              }`}
              onClick={() => {
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
          <div className="relative max-w-4xl max-h-screen p-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-6 right-6 z-10 bg-white"
              onClick={() => setExpandedVideo(null)}
            >
              <X className="w-4 h-4" />
            </Button>
            <video
              src={expandedVideo}
              className="max-w-full max-h-full object-contain"
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
