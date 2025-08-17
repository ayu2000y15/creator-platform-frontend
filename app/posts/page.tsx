"use client";

import PostFeed from "@/components/post-feed";
import AppHeader from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useState } from "react";
import PostCreateModal from "@/components/post-create-modal";
import { Post } from "@/lib/post-api";

export default function PostsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handlePostCreated = (newPost: Post) => {
    // PostFeedを再読み込みするために、ページをリロード
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader title="投稿" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PostFeed />
      </main>

      {/* 固定投稿ボタン */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        onClick={() => setShowCreateModal(true)}
      >
        <Edit className="h-6 w-6" />
      </Button>

      {/* 投稿作成モーダル */}
      <PostCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}
