"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Repeat, Loader2 } from "lucide-react";

interface CommentFormProps {
  currentUser: any;
  commentText: string;
  setCommentText: (text: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  placeholder?: string;
  className?: string;
}

export default function CommentForm({
  currentUser,
  commentText,
  setCommentText,
  onSubmit,
  submitting,
  placeholder = "コメントを書く... (100文字まで)",
  className = "",
}: CommentFormProps) {
  return (
    <div className={`interactive-element ${className}`}>
      <div className="flex items-start space-x-2 sm:space-x-3">
        <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
          <AvatarImage src={currentUser?.profile_image || undefined} />
          <AvatarFallback className="text-xs sm:text-sm">
            {currentUser?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={placeholder}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={100}
            rows={2}
            className="resize-none text-xs sm:text-sm"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {commentText.length}/100
            </span>
            <Button
              onClick={onSubmit}
              disabled={!commentText.trim() || submitting}
              size="sm"
              className="text-xs px-3 py-1 h-auto"
            >
              {submitting ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Repeat className="w-3 h-3 mr-1" />
              )}
              投稿
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
