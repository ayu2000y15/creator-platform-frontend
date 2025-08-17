"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Post } from "@/lib/post-api";
import {
  Heart,
  Zap,
  Bookmark,
  MessageCircle,
  Share2,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface ShortVideoCardProps {
  post: Post;
  isActive: boolean;
  onToggleAction: (
    postId: string,
    actionType: "like" | "spark" | "bookmark"
  ) => void;
}

export default function ShortVideoCard({
  post,
  isActive,
  onToggleAction,
}: ShortVideoCardProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // アクティブになったら自動再生
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleCommentClick = () => {
    console.log("=== Comment button clicked in fullscreen ===");
    console.log("Post ID:", post.id);
    router.push(`/posts/${post.id}`);
  };

  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ja,
    });
  };

  const videoUrl = post.media?.[0]?.file_path;

  return (
    <div className="relative h-screen w-full bg-black flex items-center justify-center">
      {/* 動画エリア */}
      <div className="relative h-full w-full max-w-md">
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-cover"
            loop
            muted={isMuted}
            playsInline
            onClick={handleVideoClick}
          />
        )}

        {/* 再生/一時停止オーバーレイ */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
            onClick={handleVideoClick}
          >
            <Play className="w-16 h-16 text-white" />
          </div>
        )}

        {/* 音量ボタン */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 hover:bg-opacity-70"
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* 右側のユーザー情報とアクション */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4">
        {/* プロフィール */}
        <div className="flex flex-col items-center space-y-2">
          <Avatar
            className="w-12 h-12 cursor-pointer border-2 border-white"
            onClick={() => handleProfileClick(post.user.id.toString())}
          >
            <AvatarImage src={post.user.profile_image || undefined} />
            <AvatarFallback className="bg-gray-600 text-white">
              {post.user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-white text-xs font-medium">
            {post.user.name}
          </span>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col items-center space-y-4">
          {/* いいね */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-2 rounded-full text-white bg-black bg-opacity-50 hover:bg-gray-500 transition-all duration-200"
              onClick={() => onToggleAction(post.id, "like")}
            >
              <Heart
                className={`w-6 h-6 transition-colors duration-200 ${
                  post.is_liked ? "fill-red-500 text-red-500" : "text-white"
                }`}
              />
            </Button>
            <span className="text-white text-xs mt-1">{post.likes_count}</span>
          </div>

          {/* スパーク */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-2 rounded-full text-white bg-black bg-opacity-50 hover:bg-gray-500 transition-all duration-200"
              onClick={() => onToggleAction(post.id, "spark")}
            >
              <Zap
                className={`w-6 h-6 transition-colors duration-200 ${
                  post.is_sparked
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-white"
                }`}
              />
            </Button>
            <span className="text-white text-xs mt-1">{post.sparks_count}</span>
          </div>

          {/* コメント */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-2 rounded-full text-white bg-black bg-opacity-50 hover:bg-gray-500 transition-all duration-200"
              onClick={handleCommentClick}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </Button>
            <span className="text-white text-xs mt-1">
              {post.replies_count}
            </span>
          </div>

          {/* シェア */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-2 rounded-full text-white bg-black bg-opacity-50 hover:bg-gray-500 transition-all duration-200"
            >
              <Share2 className="w-6 h-6 text-white" />
            </Button>
            <span className="text-white text-xs mt-1">{post.quotes_count}</span>
          </div>

          {/* ブックマーク */}
          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-2 rounded-full text-white bg-black bg-opacity-50 hover:bg-gray-500 transition-all duration-200"
              onClick={() => onToggleAction(post.id, "bookmark")}
            >
              <Bookmark
                className={`w-6 h-6 transition-colors duration-200 ${
                  post.is_bookmarked
                    ? "fill-blue-500 text-blue-500"
                    : "text-white"
                }`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* 下部のテキスト情報 */}
      <div className="absolute bottom-4 left-4 right-20 text-white">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-medium">
              @{post.user.username || post.user.name}
            </span>
            <span className="text-sm text-gray-300">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
          {post.text_content && (
            <p className="text-sm leading-relaxed">{post.text_content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
