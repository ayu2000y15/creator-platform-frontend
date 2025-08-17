"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PostCreateForm from "@/components/post-create-form";
import { Post } from "@/lib/post-api";

interface PostCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
  quotedPost?: Post;
}

export default function PostCreateModal({
  isOpen,
  onClose,
  onPostCreated,
  quotedPost,
}: PostCreateModalProps) {
  const handlePostCreated = (post: Post) => {
    onPostCreated?.(post);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {quotedPost ? "引用投稿を作成" : "新しい投稿を作成"}
          </DialogTitle>
        </DialogHeader>
        <PostCreateForm
          quotedPost={quotedPost}
          onPostCreated={handlePostCreated}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
