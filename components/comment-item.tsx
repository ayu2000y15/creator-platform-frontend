"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Comment } from "@/lib/comment-api";
import { Heart, Reply, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface CommentItemProps {
  comment: Comment;
  onReply: (parentCommentId: string, text: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  currentUser: any;
  submitting: boolean;
  depth?: number;
  className?: string;
}

export default function CommentItem({
  comment,
  onReply,
  onLike,
  replyingTo,
  setReplyingTo,
  currentUser,
  submitting,
  depth = 0,
  className = "",
}: CommentItemProps) {
  const [localReplyText, setLocalReplyText] = useState("");

  const isLiked = comment.is_liked || false;
  const likesCount = comment.likes_count || 0;
  const showMyReplyForm = replyingTo === comment.id;

  const handleReplySubmit = () => {
    if (!localReplyText.trim()) return;
    onReply(comment.id, localReplyText);
    setLocalReplyText("");
  };

  // レスポンシブ対応：スマホでは深いネストを制限
  const maxDepth = 2; // スマホでは最大2レベルまで
  const actualDepth = Math.min(depth, maxDepth);
  const marginLeft = actualDepth * 16; // スマホ用に小さくする

  return (
    <div
      style={{ marginLeft: `${marginLeft}px` }}
      className={`border-l border-gray-100 pl-2 sm:pl-3 interactive-element ${className}`}
    >
      <div className="flex items-start space-x-2 sm:space-x-3">
        <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
          <AvatarImage src={comment.user?.profile_image || undefined} />
          <AvatarFallback className="text-xs sm:text-sm">
            {comment.user?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
            <span className="font-medium text-xs sm:text-sm truncate">
              {comment.user?.name || "Unknown User"}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: ja,
              })}
            </span>
          </div>
          <p className="text-gray-800 break-words leading-relaxed text-xs sm:text-sm mb-2">
            {comment.content}
          </p>
          <div className="flex items-center space-x-2 sm:space-x-4 text-gray-500">
            <button
              onClick={() =>
                setReplyingTo(replyingTo === comment.id ? null : comment.id)
              }
              className="flex items-center space-x-1 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50 text-xs"
            >
              <Reply className="w-3 h-3" />
              <span className="hidden sm:inline">返信</span>
            </button>
            <button
              onClick={() => onLike(comment.id)}
              className={`flex items-center space-x-1 transition-colors p-1 rounded text-xs ${
                isLiked ? "text-red-600" : "hover:text-red-600"
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
              <span>{likesCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 返信入力フォーム */}
      {showMyReplyForm && (
        <div className="pl-8 sm:pl-11 pt-2 sm:pt-4 mt-2 interactive-element">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
              <AvatarImage src={currentUser?.profile_image || undefined} />
              <AvatarFallback className="text-xs sm:text-sm">
                {currentUser?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder={`${comment.user?.name || "user"} への返信...`}
                value={localReplyText}
                onChange={(e) => setLocalReplyText(e.target.value)}
                maxLength={100}
                rows={2}
                className="resize-none text-xs sm:text-sm"
              />
              <div className="flex justify-between items-center mt-2 space-x-2">
                <span className="text-xs text-gray-500 flex-1">
                  {localReplyText.length}/100
                </span>
                <div className="flex space-x-1 sm:space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReplySubmit}
                    disabled={!localReplyText.trim() || submitting}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    {submitting ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Send className="w-3 h-3 mr-1" />
                    )}
                    返信
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 子コメント（返信）の表示 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies
            .filter((reply) => reply)
            .map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onLike={onLike}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                currentUser={currentUser}
                submitting={submitting}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}
