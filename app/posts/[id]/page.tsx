"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Post, postApi } from "@/lib/post-api";
import { Comment, commentApi } from "@/lib/comment-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import PostCreateModal from "@/components/post-create-modal";
import {
  ArrowLeft,
  Heart,
  Zap,
  Bookmark,
  MessageCircle,
  Send,
  Reply,
  Loader2,
  Play,
  X,
  Share2,
  MoreVertical,
  Trash2,
  Edit,
} from "lucide-react";
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
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  // const [replyText, setReplyText] = useState(""); // 削除：ローカルstateへ移行
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 引用機能用の状態（PostCreateModalに統合）
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);

  // デモ用のダミーユーザー（ログインしていない場合）
  const demoUser = user || {
    id: 999,
    name: "デモユーザー",
    username: "demo_user",
    profile_image: "/api/placeholder/32/32",
  };

  // 投稿とコメントを読み込み
  useEffect(() => {
    const loadPostAndComments = async () => {
      try {
        setLoading(true);
        setApiError(null);

        // まず投稿だけを読み込む
        const postResponse = await postApi.getPost(postId);
        setPost(postResponse);

        // コメントの読み込みは別途試行（失敗してもエラーにしない）
        try {
          const commentsResponse = await commentApi.getComments(postId);
          setComments(commentsResponse);
        } catch (commentError) {
          console.warn("Failed to load comments:", commentError);
          setComments([]);
        }
      } catch (error) {
        console.error("Failed to load post:", error);
        setApiError("APIが利用できません");

        // APIが利用できない場合のダミーデータ
        setPost({
          id: postId,
          user_id: 1,
          view_permission: "public",
          comment_permission: "public",
          is_sensitive: false,
          content_type: "video",
          text_content:
            "これはサンプル投稿です。実際のAPIが利用できない場合に表示されます。動画コンテンツのサンプルとして表示しています。",
          is_paid: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: 1,
            name: "サンプルユーザー",
            username: "sample_user",
            profile_image: "/api/placeholder/40/40",
          },
          media: [
            {
              id: "sample-1",
              post_id: postId,
              file_path:
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              file_type: "video/mp4",
              order: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          likes_count: 42,
          sparks_count: 15,
          bookmarks_count: 8,
          replies_count: 23,
          quotes_count: 5,
          views_count: 156,
          is_liked: false,
          is_sparked: false,
          is_bookmarked: false,
        });

        // デモ用のサンプルコメントを追加（フラット構造で作成してAPIと同じ形式にする）
        const flatDemoComments: any[] = [
          // 親コメント1
          {
            id: "demo-comment-1",
            post_id: postId,
            user_id: "2",
            content: "これはデモ用のコメントです。素晴らしい動画ですね！",
            parent_id: undefined,
            likes_count: 3,
            sparks_count: 1,
            is_liked: false, // サーバーからの初期値と同じく、デフォルトはfalse
            is_sparked: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString(),
            user: {
              id: 2,
              name: "デモユーザー1",
              username: "demo_user1",
              profile_image: "/api/placeholder/32/32",
            },
          },
          // 親コメント1への返信
          {
            id: "demo-reply-1",
            post_id: postId,
            user_id: "3",
            content: "私も同感です！",
            parent_id: "demo-comment-1",
            likes_count: 1,
            sparks_count: 0,
            is_liked: false,
            is_sparked: false,
            created_at: new Date(Date.now() - 1800000).toISOString(),
            updated_at: new Date(Date.now() - 1800000).toISOString(),
            user: {
              id: 3,
              name: "デモユーザー2",
              username: "demo_user2",
              profile_image: "/api/placeholder/32/32",
            },
          },
          // 返信への返信
          {
            id: "demo-reply-1-1",
            post_id: postId,
            user_id: "4",
            content: "本当にそうですね！",
            parent_id: "demo-reply-1",
            likes_count: 0,
            sparks_count: 2,
            is_liked: false,
            is_sparked: false,
            created_at: new Date(Date.now() - 900000).toISOString(),
            updated_at: new Date(Date.now() - 900000).toISOString(),
            user: {
              id: 4,
              name: "デモユーザー3",
              username: "demo_user3",
              profile_image: "/api/placeholder/32/32",
            },
          },
          // 親コメント2
          {
            id: "demo-comment-2",
            post_id: postId,
            user_id: "5",
            content: "コンテンツの質が高いですね。次回も楽しみにしています。",
            parent_id: undefined,
            likes_count: 5,
            sparks_count: 3,
            is_liked: false,
            is_sparked: false,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            updated_at: new Date(Date.now() - 7200000).toISOString(),
            user: {
              id: 5,
              name: "デモユーザー4",
              username: "demo_user4",
              profile_image: "/api/placeholder/32/32",
            },
          },
          // 親コメント2への返信
          {
            id: "demo-reply-2",
            post_id: postId,
            user_id: "6",
            content: "期待しています！",
            parent_id: "demo-comment-2",
            likes_count: 2,
            sparks_count: 1,
            is_liked: false, // サーバーからの初期値と同じく、デフォルトはfalse
            is_sparked: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString(),
            user: {
              id: 6,
              name: "デモユーザー5",
              username: "demo_user5",
              profile_image: "/api/placeholder/32/32",
            },
          },
        ];

        // フラット構造をツリー構造に変換（実際のAPIと同じ処理）
        const demoCommentsTree = commentApi.buildCommentTree(flatDemoComments);
        setComments(demoCommentsTree);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      loadPostAndComments();
    }
  }, [postId]); // localLikedCommentsを依存関係から除外してループを防ぐ

  // アクション処理
  const handleToggleAction = async (
    actionType: "like" | "spark" | "bookmark"
  ) => {
    if (!user || !post) {
      toast({ title: "ログインが必要です", variant: "destructive" });
      return;
    }

    const isCurrentlyActive =
      actionType === "like"
        ? !!post.is_liked
        : actionType === "spark"
        ? !!post.is_sparked
        : !!post.is_bookmarked;

    // オプティミスティック更新
    const updatedPost: Post = { ...post };

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

    setPost(updatedPost);

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
      setPost(post);
      toast({
        title: "エラー",
        description: "操作に失敗しました",
        variant: "destructive",
      });
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

      if (apiError || !user) {
        // デモモード: ダミーコメントを作成
        const demoComment: Comment = {
          id: `demo-comment-${Date.now()}`,
          post_id: postId,
          user_id: demoUser.id?.toString() || "current-user",
          content: commentText,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: demoUser.id || 999,
            name: demoUser.name || "現在のユーザー",
            username: demoUser.username || undefined,
            profile_image: demoUser.profile_image || undefined,
          },
        };

        setComments([demoComment, ...comments]);
        setCommentText("");

        // 投稿のコメント数を更新
        if (post) {
          setPost({
            ...post,
            replies_count: post.replies_count + 1,
          });
        }

        toast({
          title: apiError
            ? "コメントを投稿しました（デモモード）"
            : "コメントを投稿しました（ログイン後に実際に投稿されます）",
          variant: "default",
        });
      } else {
        // 実際のAPI呼び出し
        const newComment = await commentApi.createComment(postId, commentText);
        setComments([newComment, ...comments]);
        setCommentText("");

        // 投稿のコメント数を更新
        if (post) {
          setPost({
            ...post,
            replies_count: post.replies_count + 1,
          });
        }

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

      if (apiError || !user) {
        // デモモード: ダミー返信を作成
        const demoReply: Comment = {
          id: `demo-reply-${Date.now()}`,
          post_id: postId,
          user_id: demoUser.id?.toString() || "current-user",
          content: text,
          parent_id: parentCommentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: demoUser.id || 999,
            name: demoUser.name || "現在のユーザー",
            username: demoUser.username || undefined,
            profile_image: demoUser.profile_image || undefined,
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

  // コメントのいいね機能（投稿と同じシンプルな仕組み）
  const handleCommentLike = async (commentId: string) => {
    if (!user && !apiError) {
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

    // オプティミスティック更新（投稿と同じ仕組み）
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
    if (apiError || !user) {
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
      // エラー時は元に戻す（投稿と同じ処理）
      console.error("Comment like failed:", error);
      setComments(originalComments);
      toast({
        title: "エラー",
        description: "いいねの操作に失敗しました",
        variant: "destructive",
      });
    }
  };

  // コメントのスパーク機能
  const handleCommentSpark = async (commentId: string) => {
    if (!user && !apiError) {
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

    const wasSparked = comment.is_sparked || false;

    // オプティミスティック更新
    const updateCommentInTree = (comments: Comment[]): Comment[] => {
      return comments.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            is_sparked: !wasSparked,
            sparks_count: wasSparked
              ? Math.max(0, (c.sparks_count || 0) - 1)
              : (c.sparks_count || 0) + 1,
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
    if (apiError || !user) {
      toast({
        title: wasSparked
          ? "スパークを取り消しました（デモモード）"
          : "スパークしました（デモモード）",
        variant: "default",
      });
      return;
    }

    try {
      if (wasSparked) {
        await commentApi.unsparkComment(commentId);
      } else {
        await commentApi.sparkComment(commentId);
      }

      toast({
        title: wasSparked ? "スパークを取り消しました" : "スパークしました",
        variant: "default",
      });
    } catch (error) {
      console.error("Comment spark failed:", error);
      setComments(originalComments);
      toast({
        title: "エラー",
        description: "スパークの操作に失敗しました",
        variant: "destructive",
      });
    }
  };

  // 投稿の引用機能
  const handleQuotePost = () => {
    if (!post) return;
    setQuotedPost(post);
    setShowQuoteModal(true);
  };

  // コメントの引用機能
  const handleCommentQuote = (comment: Comment) => {
    if (!post) return;

    // コメントの情報を含む擬似的な投稿オブジェクトを作成
    const commentAsPost: Post = {
      id: comment.id,
      user_id:
        typeof comment.user_id === "string"
          ? parseInt(comment.user_id)
          : comment.user_id,
      content_type: "text",
      text_content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      view_permission: "public",
      comment_permission: "public",
      is_sensitive: false,
      is_paid: false,
      likes_count: comment.likes_count || 0,
      sparks_count: comment.sparks_count || 0,
      replies_count: 0,
      bookmarks_count: 0,
      quotes_count: 0,
      views_count: 0,
      is_liked: comment.is_liked || false,
      is_sparked: comment.is_sparked || false,
      is_bookmarked: false,
      user: {
        id: comment.user?.id || 0,
        name: comment.user?.name || "Unknown User",
        username: comment.user?.username,
        profile_image: comment.user?.profile_image,
      },
      media: [],
      // 元の投稿への参照を保持
      quoted_post_id: post.id,
      quoted_post: post,
      // コメント引用であることを示すマーカー
      __isCommentQuote: true,
    };

    setQuotedPost(commentAsPost);
    setShowQuoteModal(true);
  };

  // 引用投稿作成完了時のハンドラ
  const handleQuoteCreated = (newPost?: Post) => {
    setShowQuoteModal(false);
    setQuotedPost(null);
    if (newPost) {
      toast({
        title: "引用投稿を作成しました",
        variant: "default",
      });
    }
  };

  // 引用モーダルキャンセル時のハンドラ
  const handleQuoteCancel = () => {
    setShowQuoteModal(false);
    setQuotedPost(null);
  };

  const handleEdit = () => {
    // TODO: 編集機能を実装
    console.log("Edit post:", post?.id);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!user || !post || user.id !== post.user.id || isDeleting) return;

    try {
      setIsDeleting(true);
      await postApi.deletePost(post.id);

      toast({
        title: "投稿を削除しました",
        variant: "default",
      });

      // 削除後は前のページに戻る
      router.back();
    } catch (error) {
      console.error("削除エラー:", error);
      toast({
        title: "エラー",
        description: "投稿の削除に失敗しました",
        variant: "destructive",
      });
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

    const handleMouseEnter = (e: React.MouseEvent<HTMLVideoElement>) => {
      if (isShort) {
        e.currentTarget.play();
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLVideoElement>) => {
      if (isShort) {
        e.currentTarget.pause();
        e.currentTarget.currentTime = 0;
      }
    };

    return (
      <div
        className={`relative group ${aspectClass} rounded-lg overflow-hidden bg-black cursor-pointer`}
        onClick={() => setExpandedVideo(media.file_path)}
      >
        <video
          src={media.file_path}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
          controls={false}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onError={(e) => {
            console.log("Video load error:", e);
            e.currentTarget.style.display = "none";
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

  // 返信を個別に描画するためのサブコンポーネント
  const ReplyItem = ({
    comment,
    parentComment,
    depth = 1,
  }: {
    comment: Comment;
    parentComment: Comment;
    depth?: number;
  }) => {
    const [localReplyText, setLocalReplyText] = useState("");
    const isLiked = comment.is_liked || false;
    const isSparked = comment.is_sparked || false;
    const likesCount = comment.likes_count || 0;
    const sparksCount = comment.sparks_count || 0;
    const showMyReplyForm = replyingTo === comment.id;

    const handleReplySubmit = () => {
      if (!localReplyText.trim()) return;
      handleSubmitReply(comment.id, localReplyText);
      setLocalReplyText(""); // 送信後にローカルのテキストをクリア
    };

    // 深いネストの場合は左のマージンを調整（より控えめな値に変更）
    const marginLeft = Math.min(depth * 24, 72); // 最大3レベル、より控えめに

    // メインコメント（depth=0）の場合はカードスタイル、返信の場合は接続線スタイル
    if (depth === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex space-x-3">
            <Avatar
              className="w-10 h-10 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push(`/profile/${comment.user?.id}`)}
            >
              <AvatarImage src={comment.user?.profile_image || undefined} />
              <AvatarFallback>
                {comment.user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <p
                  className="font-semibold text-gray-900 text-sm cursor-pointer hover:underline"
                  onClick={() => router.push(`/profile/${comment.user?.id}`)}
                >
                  {comment.user?.name || "Unknown User"}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </p>
              </div>
              <p className="text-gray-800 break-words leading-relaxed text-sm mb-2">
                {comment.content}
              </p>
              <div className="flex items-center space-x-4 text-gray-500">
                <button
                  onClick={() =>
                    setReplyingTo(showMyReplyForm ? null : comment.id)
                  }
                  className="flex items-center space-x-1 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50 text-sm"
                >
                  <Reply className="w-4 h-4" />
                  <span>返信</span>
                  {comment.replies && comment.replies.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      {comment.replies.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleCommentLike(comment.id)}
                  className={`flex items-center space-x-1 transition-colors p-1 rounded ${
                    isLiked ? "text-red-600" : "hover:text-red-600"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                  />
                  <span className="text-sm">{likesCount}</span>
                </button>
                <button
                  onClick={() => handleCommentSpark(comment.id)}
                  className={`flex items-center space-x-1 transition-colors p-1 rounded ${
                    isSparked ? "text-yellow-600" : "hover:text-yellow-600"
                  }`}
                >
                  <Zap
                    className={`w-4 h-4 ${isSparked ? "fill-current" : ""}`}
                  />
                  <span className="text-sm">{sparksCount}</span>
                </button>
                <button
                  onClick={() => handleCommentQuote(comment)}
                  className="flex items-center space-x-1 hover:text-green-600 transition-colors p-1 rounded hover:bg-green-50 text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">{comment.quotes_count || 0}</span>
                </button>
              </div>
            </div>
          </div>

          {/* この親コメントへの返信入力フォーム */}
          {showMyReplyForm && (
            <div className="pl-12 pt-4 mt-2">
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={demoUser?.profile_image || undefined} />
                  <AvatarFallback className="text-sm">
                    {demoUser?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder={`${comment.user?.name || "user"} への返信...`}
                    value={localReplyText}
                    onChange={(e) => setLocalReplyText(e.target.value)}
                    maxLength={100}
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <div className="flex justify-end items-center mt-2 space-x-2">
                    <span className="text-xs text-gray-500 flex-1">
                      {localReplyText.length}/100
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(null)}
                    >
                      キャンセル
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReplySubmit}
                      disabled={!localReplyText.trim() || submitting}
                    >
                      <Send className="w-3 h-3 mr-1.5" /> 返信
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 返信一覧 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              {comment.replies
                .filter((reply) => reply)
                .map((reply) => (
                  <ReplyItem
                    key={reply.id}
                    comment={reply}
                    parentComment={comment}
                    depth={1}
                  />
                ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative pt-4" style={{ paddingLeft: `${marginLeft}px` }}>
        {/* 接続線 - ネストの深さに応じて位置を調整 */}
        <div
          className="absolute -top-1 bottom-0 w-0.5 bg-gray-200"
          style={{ left: `${Math.max(5, marginLeft - 19)}px` }}
        />
        <div
          className="absolute top-5 h-0.5 w-7 bg-gray-200"
          style={{ left: `${Math.max(5, marginLeft - 19)}px` }}
        />

        {/* 返信内容 */}
        <div className="flex space-x-3">
          <Avatar
            className="w-8 h-8 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push(`/profile/${comment.user?.id}`)}
          >
            <AvatarImage src={comment.user?.profile_image || undefined} />
            <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
              {comment.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p
                className="font-semibold text-gray-900 text-sm truncate cursor-pointer hover:underline"
                onClick={() => router.push(`/profile/${comment.user?.id}`)}
              >
                {comment.user?.name || "Unknown User"}
              </p>
              <p className="text-gray-500 text-xs">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ja,
                })}
              </p>
            </div>
            <p className="text-gray-800 break-words leading-relaxed text-sm mb-2">
              {comment.content}
            </p>
            <div className="flex items-center space-x-4 text-gray-500">
              <button
                onClick={() =>
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
                }
                className="flex items-center space-x-1 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50 text-xs"
              >
                <Reply className="w-3 h-3" />
                <span>返信</span>
              </button>
              <button
                onClick={() => handleCommentLike(comment.id)}
                className={`flex items-center space-x-1 transition-colors p-1 rounded text-xs ${
                  isLiked ? "text-red-600" : "hover:text-red-600"
                }`}
              >
                <Heart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
                <span>{likesCount}</span>
              </button>
              <button
                onClick={() => handleCommentSpark(comment.id)}
                className={`flex items-center space-x-1 transition-colors p-1 rounded text-xs ${
                  isSparked ? "text-yellow-600" : "hover:text-yellow-600"
                }`}
              >
                <Zap className={`w-3 h-3 ${isSparked ? "fill-current" : ""}`} />
                <span>{sparksCount}</span>
              </button>
              <button
                onClick={() => handleCommentQuote(comment)}
                className="flex items-center space-x-1 hover:text-green-600 transition-colors p-1 rounded hover:bg-green-50 text-xs"
              >
                <Share2 className="w-3 h-3" />
                <span>{comment.quotes_count || 0}</span>
              </button>
            </div>
          </div>
        </div>

        {/* この返信への返信入力フォーム */}
        {showMyReplyForm && (
          <div className="pl-12 pt-4 mt-2">
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={demoUser?.profile_image || undefined} />
                <AvatarFallback className="text-sm">
                  {demoUser?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder={`${comment.user?.name || "user"} への返信...`}
                  value={localReplyText}
                  onChange={(e) => setLocalReplyText(e.target.value)}
                  maxLength={100}
                  rows={3}
                  className="resize-none text-sm"
                />
                <div className="flex justify-end items-center mt-2 space-x-2">
                  <span className="text-xs text-gray-500 flex-1">
                    {localReplyText.length}/100
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReplySubmit}
                    disabled={!localReplyText.trim() || submitting}
                  >
                    <Send className="w-3 h-3 mr-1.5" /> 返信
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* この返信への返信一覧（再帰的に表示） */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies
              .filter((reply) => reply)
              .map((reply) => (
                <ReplyItem
                  key={reply.id}
                  comment={reply}
                  parentComment={comment}
                  depth={depth + 1}
                />
              ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-gray-600">投稿を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">投稿が見つかりません</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">投稿詳細</h1>
          {apiError && (
            <span className="ml-4 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
              デモモード
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 投稿コンテンツ */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* ユーザー情報 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Avatar
                className="w-10 h-10 mr-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => router.push(`/profile/${post.user?.id}`)}
              >
                <AvatarImage src={post.user?.profile_image || undefined} />
                <AvatarFallback>
                  {post.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p
                  className="font-semibold text-sm cursor-pointer hover:underline"
                  onClick={() => router.push(`/profile/${post.user?.id}`)}
                >
                  {post.user?.name || "Unknown User"}
                </p>
                {post.user?.username && (
                  <p
                    className="text-xs text-gray-500 cursor-pointer hover:underline"
                    onClick={() => router.push(`/profile/${post.user?.id}`)}
                  >
                    @{post.user.username}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </p>
              </div>
            </div>
            {user && user.id === post.user.id && (
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

          {/* テキストコンテンツ */}
          {post.text_content && (
            <div className="mb-4">
              <p className="text-gray-800 whitespace-pre-wrap">
                {post.text_content}
              </p>
            </div>
          )}

          {/* メディア */}
          {post.media && post.media.length > 0 && (
            <div className="mb-4">
              {post.content_type === "video" ||
              post.content_type === "short_video" ? (
                // 動画投稿の場合
                <div className="w-full">
                  {post.media
                    .filter((media) => media.file_type.startsWith("video"))
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
                    >
                      {media.file_type.startsWith("image") && (
                        <Image
                          src={media.file_path}
                          alt="投稿画像"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                      {media.file_type.startsWith("video") &&
                        renderVideoPreview(media, false)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 引用投稿表示 */}
          {post.quoted_post && (
            <div className="mb-4 border rounded-lg p-3 bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">引用投稿:</div>
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage
                    src={post.quoted_post.user.profile_image || undefined}
                  />
                  <AvatarFallback className="text-sm">
                    {post.quoted_post.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {post.quoted_post.user.name}
                  </div>
                  <div className="text-sm text-gray-800 mt-1">
                    {post.quoted_post.text_content}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 引用コメント表示 */}
          {post.quoted_reply && (
            <div className="mb-4 space-y-3">
              <div className="border rounded-lg p-3 bg-blue-50">
                <div className="text-sm text-gray-600 mb-2">引用コメント:</div>
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage
                      src={post.quoted_reply.user.profile_image || undefined}
                    />
                    <AvatarFallback className="text-sm">
                      {post.quoted_reply.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {post.quoted_reply.user.name}
                    </div>
                    <div className="text-sm text-gray-800 mt-1">
                      {post.quoted_reply.content}
                    </div>
                  </div>
                </div>
              </div>

              {/* コメントの元投稿 */}
              {post.quoted_reply.post && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="text-sm text-gray-600 mb-2">元の投稿:</div>
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage
                        src={
                          post.quoted_reply.post.user.profile_image || undefined
                        }
                      />
                      <AvatarFallback className="text-sm">
                        {post.quoted_reply.post.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {post.quoted_reply.post.user.name}
                      </div>
                      <div className="text-sm text-gray-800 mt-1">
                        {post.quoted_reply.post.text_content}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => handleToggleAction("like")}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${
                    post.is_liked ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                <span className="text-sm">{post.likes_count}</span>
              </button>
              <button
                onClick={() => handleToggleAction("spark")}
                className="flex items-center space-x-2 text-gray-600 hover:text-yellow-600 transition-colors"
              >
                <Zap
                  className={`w-5 h-5 ${
                    post.is_sparked ? "fill-yellow-500 text-yellow-500" : ""
                  }`}
                />
                <span className="text-sm">{post.sparks_count}</span>
              </button>
              <div className="flex items-center space-x-2 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{post.replies_count}</span>
              </div>
              <button
                onClick={() => handleQuotePost()}
                className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm">{post.quotes_count}</span>
              </button>
            </div>
            <button
              onClick={() => handleToggleAction("bookmark")}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Bookmark
                className={`w-5 h-5 ${
                  post.is_bookmarked ? "fill-blue-500 text-blue-500" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* コメント入力フォーム */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={demoUser?.profile_image || undefined} />
              <AvatarFallback>
                {demoUser?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="コメントを書く... (100文字まで)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={100}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {commentText.length}/100
                </span>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submitting}
                  size="sm"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  投稿
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* コメント一覧 */}
        <div className="space-y-4">
          {comments.map((comment: Comment) => (
            <ReplyItem
              key={comment.id}
              comment={comment}
              parentComment={comment}
              depth={0}
            />
          ))}
        </div>

        {comments.length === 0 && !apiError && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>まだコメントがありません</p>
            <p className="text-sm text-gray-400 mt-1">
              最初のコメントを投稿してみましょう
            </p>
          </div>
        )}

        {apiError && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>コメント機能はデモモードです</p>
            <p className="text-sm text-gray-400 mt-1">
              APIが利用可能になると実際のコメントが表示されます
            </p>
          </div>
        )}
      </div>

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

      {/* 引用モーダル（PostCreateModalを使用） */}
      {showQuoteModal && (
        <PostCreateModal
          isOpen={showQuoteModal}
          onClose={handleQuoteCancel}
          onPostCreated={handleQuoteCreated}
          quotedPost={quotedPost || undefined}
        />
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
    </div>
  );
}
