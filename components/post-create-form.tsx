"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { postApi, CreatePostData, Post } from "@/lib/post-api";
import {
  ImageIcon,
  Video,
  FileText,
  Quote,
  Repeat,
  X,
  Play,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageModal from "@/components/image-modal";
import { useAuth } from "@/contexts/auth-context";

interface PostCreateFormProps {
  onPostCreated?: (post: Post) => void;
  quotedPost?: Post;
  onCancel?: () => void;
}

export default function PostCreateForm({
  onPostCreated,
  quotedPost,
  onCancel,
}: PostCreateFormProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreatePostData>>({
    content_type: quotedPost ? "quote" : "text",
    text_content: "",
    view_permission: "public",
    comment_permission: "public",
    is_sensitive: false,
    is_paid: false,
    price: undefined,
    introduction: "",
    quoted_post_id: quotedPost?.id,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  const openImageModal = (images: string[], index: number) => {
    setModalImages(images);
    setModalIndex(index);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
  };

  // ログイン必須の操作をチェックする関数
  const requireAuth = (): boolean => {
    if (!currentUser) {
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}&action=post`
      );
      return false;
    }
    return true;
  };

  const handleInputChange = (
    field: keyof CreatePostData,
    value: string | number | boolean | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log("Files selected:", files);

    if (files.length > 0) {
      setIsUploading(true);

      // ファイル数制限チェック
      if (
        (formData.content_type === "text" ||
          formData.content_type === "quote") &&
        files.length > 4
      ) {
        toast({
          title: "エラー",
          description: "テキスト・引用投稿では画像は最大4枚までです",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      if (
        (formData.content_type === "video" ||
          formData.content_type === "short_video") &&
        files.length > 1
      ) {
        toast({
          title: "エラー",
          description: "動画投稿では1つの動画ファイルのみ選択できます",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // ファイルタイプチェック
      const isTextPost = formData.content_type === "text";
      const isVideoPost =
        formData.content_type === "video" ||
        formData.content_type === "short_video";

      for (const file of files) {
        if (isTextPost && !file.type.startsWith("image/")) {
          toast({
            title: "エラー",
            description: "テキスト投稿では画像ファイルのみ選択できます",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        if (isVideoPost && !file.type.startsWith("video/")) {
          toast({
            title: "エラー",
            description: "動画投稿では動画ファイルのみ選択できます",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        // ショート動画の場合、1分制限チェック（概算）
        if (
          formData.content_type === "short_video" &&
          file.type.startsWith("video/")
        ) {
          // ファイルサイズから概算時間をチェック（簡易的）
          const maxSize = 50 * 1024 * 1024; // 50MB程度を1分の目安とする
          if (file.size > maxSize) {
            toast({
              title: "警告",
              description:
                "ファイルサイズが大きすぎます。1分以内の動画をアップロードしてください",
              variant: "destructive",
            });
            setIsUploading(false);
            return;
          }
        }

        // 通常動画の場合、1時間制限チェック（概算）
        if (
          formData.content_type === "video" &&
          file.type.startsWith("video/")
        ) {
          const maxSize = 2 * 1024 * 1024 * 1024; // 2GB程度を1時間の目安とする
          if (file.size > maxSize) {
            toast({
              title: "警告",
              description:
                "ファイルサイズが大きすぎます。1時間以内の動画をアップロードしてください",
              variant: "destructive",
            });
            setIsUploading(false);
            return;
          }
        }
      }

      setSelectedFiles(files);

      // プレビュー生成
      const newPreviews: string[] = [];
      let processedCount = 0;

      files.forEach((file) => {
        console.log("Processing file:", file.name, file.type);
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          const url = URL.createObjectURL(file);
          newPreviews.push(url);
          console.log("Created preview URL:", url);
        }

        processedCount++;
        if (processedCount === files.length) {
          setPreviews(newPreviews);
          console.log("Previews set:", newPreviews);
          setIsUploading(false);
        }
      });
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);

    // ファイル入力をクリア
    if (fileInputRef.current && newFiles.length === 0) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    // 認証チェック
    if (!requireAuth()) {
      return;
    }

    // バリデーション
    const contentType = formData.content_type;
    const hasText = formData.text_content?.trim();
    const hasFiles = selectedFiles.length > 0;

    // テキスト投稿の場合：テキスト必須
    if (contentType === "text" && !hasText) {
      toast({
        title: "エラー",
        description: "テキスト投稿では投稿内容の入力が必須です",
        variant: "destructive",
      });
      return;
    }

    // 動画投稿の場合：動画必須
    if (
      (contentType === "video" || contentType === "short_video") &&
      !hasFiles
    ) {
      toast({
        title: "エラー",
        description: "動画投稿では動画ファイルが必須です",
        variant: "destructive",
      });
      return;
    }

    // ショート動画の場合：テキストがあってはいけない
    if (contentType === "short_video" && hasText) {
      toast({
        title: "エラー",
        description: "ショート動画ではテキストを入力できません",
        variant: "destructive",
      });
      return;
    }

    // 引用投稿でない場合の基本チェック
    if (!quotedPost && !hasText && !hasFiles) {
      toast({
        title: "エラー",
        description: "投稿内容を入力してください",
        variant: "destructive",
      });
      return;
    }

    if (formData.is_paid && (!formData.price || formData.price <= 0)) {
      toast({
        title: "エラー",
        description: "有料投稿の場合は価格を設定してください",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const postData: CreatePostData = {
        content_type: formData.content_type as
          | "text"
          | "video"
          | "short_video"
          | "quote",
        text_content:
          contentType === "short_video"
            ? undefined
            : formData.text_content?.trim(),
        view_permission: formData.view_permission as
          | "public"
          | "followers"
          | "mutuals",
        comment_permission: formData.comment_permission as
          | "public"
          | "followers"
          | "mutuals",
        is_sensitive: formData.is_sensitive,
        quoted_post_id: quotedPost?.__isCommentQuote
          ? undefined
          : formData.quoted_post_id,
        quoted_reply_id: quotedPost?.__isCommentQuote
          ? quotedPost.id
          : undefined,
        is_paid: formData.is_paid,
        price: formData.price,
        introduction: formData.introduction?.trim(),
      };

      // デバッグ用ログ
      console.log("Creating post with data:", postData);
      console.log("Is comment quote:", quotedPost?.__isCommentQuote);
      console.log("Quoted post ID:", postData.quoted_post_id);
      console.log("Quoted reply ID:", postData.quoted_reply_id);

      if (selectedFiles.length > 0) {
        const fileList = new DataTransfer();
        selectedFiles.forEach((file) => fileList.items.add(file));
        postData.media = fileList.files;
      }

      const newPost = await postApi.createPost(postData);

      // デバッグ用：投稿作成後のレスポンスをログ出力
      console.log("Created post:", newPost);
      if (quotedPost?.__isCommentQuote) {
        console.log("Comment quote post created:", {
          quoted_reply_id: newPost.quoted_reply_id,
          quoted_reply: newPost.quoted_reply,
          quoted_post_id: newPost.quoted_post_id,
          quoted_post: newPost.quoted_post,
        });
      }

      toast({
        title: "投稿完了",
        description: "投稿が正常に作成されました",
      });

      // フォームリセット
      setFormData({
        content_type: "text",
        text_content: "",
        view_permission: "public",
        comment_permission: "public",
        is_sensitive: false,
        is_paid: false,
        price: undefined,
        introduction: "",
      });
      setSelectedFiles([]);
      setPreviews([]);
      setExpandedVideo(null);

      // ファイル入力をクリア
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onPostCreated?.(newPost);
    } catch {
      const errorMessage = "投稿の作成に失敗しました";

      toast({
        title: "投稿エラー",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "short_video":
        return <Video className="w-4 h-4" />;
      case "quote":
        return <Quote className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <>
      {!currentUser ? (
        <Card>
          <CardHeader>
            <CardTitle>ログインが必要です</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              投稿を作成するにはログインが必要です。
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full max-w-xs"
            >
              ログインページへ
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getContentTypeIcon(formData.content_type || "text")}
              新しい投稿を作成
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 投稿種別選択 */}
            {!quotedPost && (
              <div className="space-y-2">
                <Label>投稿種別</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value) => {
                    handleInputChange("content_type", value);
                    // ファイルをクリア（種別変更時）
                    setSelectedFiles([]);
                    setPreviews([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">テキスト投稿</SelectItem>
                    <SelectItem value="video">動画投稿</SelectItem>
                    <SelectItem value="short_video">ショート動画</SelectItem>
                  </SelectContent>
                </Select>
                {/* 投稿種別の説明 */}
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {formData.content_type === "text" &&
                    "テキスト必須、画像は任意（最大4枚）"}
                  {formData.content_type === "video" &&
                    "動画必須（最大1時間）、テキストは任意"}
                  {formData.content_type === "short_video" &&
                    "動画必須（最大1分）、テキストは入力できません"}
                </div>
              </div>
            )}

            {/* 引用投稿表示 */}
            {quotedPost && (
              <div className="space-y-3">
                {/* コメント引用の場合 */}
                {quotedPost.__isCommentQuote ? (
                  <>
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <div className="text-sm text-gray-600 mb-2">
                        引用コメント:
                      </div>
                      <div className="font-medium">{quotedPost.user.name}</div>
                      <div className="text-sm mt-1">
                        {quotedPost.text_content}
                      </div>
                    </div>

                    {/* 元の投稿も表示 */}
                    {quotedPost.quoted_post && (
                      <div
                        className="border rounded-lg p-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() =>
                          router.push(`/posts/${quotedPost.quoted_post?.id}`)
                        }
                      >
                        <div className="text-sm text-gray-600 mb-2">
                          元の投稿:
                        </div>
                        <div className="font-medium">
                          {quotedPost.quoted_post.user.name}
                        </div>
                        <div className="text-sm mt-1">
                          {quotedPost.quoted_post.text_content}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* 通常の投稿引用 */
                  <div
                    className="border rounded-lg p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => router.push(`/posts/${quotedPost.id}`)}
                  >
                    <div className="font-medium">{quotedPost.user.name}</div>
                    <div className="text-sm mt-1">
                      {quotedPost.text_content}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* テキスト入力 */}
            {formData.content_type !== "short_video" && (
              <div className="space-y-2">
                <Label>
                  投稿内容
                  {formData.content_type === "text" && (
                    <span className="text-red-500 ml-1">*必須</span>
                  )}
                  {formData.content_type === "video" && (
                    <span className="text-gray-500 ml-1">（任意）</span>
                  )}
                </Label>
                <Textarea
                  value={formData.text_content}
                  onChange={(e) =>
                    handleInputChange("text_content", e.target.value)
                  }
                  placeholder={
                    formData.content_type === "text"
                      ? "今何をしていますか？"
                      : "動画の説明を入力（任意）"
                  }
                  rows={4}
                  maxLength={1000}
                  required={formData.content_type === "text"}
                />
                <div className="text-xs text-gray-500 text-right">
                  {formData.text_content?.length || 0}/1000
                </div>
              </div>
            )}

            {formData.content_type === "short_video" && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-700 font-medium">
                  ショート動画について
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  ショート動画はテキストなしで動画のみの投稿です。最大1分までの動画をアップロードしてください。
                </div>
              </div>
            )}

            {/* メディアファイル */}
            <div className="space-y-2">
              <Label>
                メディアファイル
                {(formData.content_type === "video" ||
                  formData.content_type === "short_video") && (
                  <span className="text-red-500 ml-1">*必須</span>
                )}
                {formData.content_type === "text" && (
                  <span className="text-gray-500 ml-1">（任意・最大4枚）</span>
                )}
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFileSelect}
                  disabled={isUploading || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  {isUploading
                    ? "アップロード中..."
                    : formData.content_type === "text" ||
                      formData.content_type === "quote"
                    ? "画像を選択"
                    : "動画を選択"}
                </Button>
                {isUploading && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    処理中...
                  </div>
                )}
              </div>

              {/* ファイル制限の注意書き */}
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                {formData.content_type === "text" &&
                  "画像ファイルのみ（JPEG, PNG, GIF等）、最大4枚まで"}
                {formData.content_type === "video" &&
                  "動画ファイル必須（MP4, MOV等）、最大1時間まで"}
                {formData.content_type === "short_video" &&
                  "動画ファイル必須（MP4, MOV等）、最大1分まで"}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple={
                  formData.content_type === "text" ||
                  formData.content_type === "quote"
                }
                accept={
                  formData.content_type === "text" ||
                  formData.content_type === "quote"
                    ? "image/*"
                    : formData.content_type === "video" ||
                      formData.content_type === "short_video"
                    ? "video/*"
                    : "image/*,video/*"
                }
                onChange={handleFileChange}
                className="hidden"
              />

              {/* ファイルプレビュー */}
              {previews.length > 0 && (
                <div className="space-y-2">
                  {/* ナビゲーション付きプレビュー */}
                  <div className="relative">
                    <div
                      className={`grid gap-2 ${
                        formData.content_type === "text"
                          ? "grid-cols-2"
                          : "grid-cols-1"
                      }`}
                    >
                      {previews.map((preview, index) => (
                        <div key={index} className="relative">
                          {selectedFiles[index].type.startsWith("image/") ? (
                            <div
                              className="w-full h-32 bg-gray-100 rounded flex items-center justify-center bg-cover bg-center cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundImage: `url(${preview})` }}
                              onClick={() => {
                                const imageIndexes = selectedFiles
                                  .map((file, idx) =>
                                    file.type.startsWith("image/") ? idx : -1
                                  )
                                  .filter((idx) => idx !== -1);
                                const imagePreviews = imageIndexes.map(
                                  (idx) => previews[idx]
                                );
                                const imageIndex = imageIndexes.indexOf(index);
                                if (imageIndex !== -1) {
                                  openImageModal(imagePreviews, imageIndex);
                                }
                              }}
                            />
                          ) : (
                            <div className="relative group">
                              <video
                                ref={(el) => {
                                  if (el) videoRefs.current[preview] = el;
                                }}
                                src={preview}
                                className={`w-full object-cover rounded cursor-pointer transition-transform group-hover:scale-[1.02] ${
                                  formData.content_type === "short_video"
                                    ? "aspect-[9/16] max-h-96" // TikTok風の縦長
                                    : "aspect-video max-h-64" // 通常の動画アスペクト比
                                }`}
                                muted
                                loop
                                playsInline
                                onMouseEnter={() => {
                                  const video = videoRefs.current[preview];
                                  if (video) {
                                    video.currentTime = 0;
                                    video.play().catch(() => {
                                      // 自動再生が失敗した場合は無視
                                    });
                                  }
                                }}
                                onMouseLeave={() => {
                                  const video = videoRefs.current[preview];
                                  if (video) {
                                    video.pause();
                                    video.currentTime = 0;
                                  }
                                }}
                                onClick={() => {
                                  setExpandedVideo(preview);
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black bg-opacity-50 rounded-full p-3 group-hover:bg-opacity-70 transition-all">
                                  <Play
                                    className="w-6 h-6 text-white"
                                    fill="white"
                                  />
                                </div>
                              </div>
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {formData.content_type === "short_video"
                                  ? "ショート"
                                  : "動画"}
                              </div>
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 w-6 h-6 p-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 閲覧権限 */}
            <div className="space-y-2">
              <Label>閲覧権限</Label>
              <Select
                value={formData.view_permission}
                onValueChange={(value) =>
                  handleInputChange("view_permission", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">全員</SelectItem>
                  <SelectItem value="followers">フォロワーのみ</SelectItem>
                  <SelectItem value="mutuals">相互フォローのみ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* コメント権限 */}
            <div className="space-y-2">
              <Label>コメント権限</Label>
              <Select
                value={formData.comment_permission}
                onValueChange={(value) =>
                  handleInputChange("comment_permission", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">全員</SelectItem>
                  <SelectItem value="followers">フォロワーのみ</SelectItem>
                  <SelectItem value="mutuals">相互フォローのみ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* センシティブコンテンツ */}
            <div className="flex items-center space-x-2">
              <Switch
                id="sensitive"
                checked={formData.is_sensitive}
                onCheckedChange={(checked) =>
                  handleInputChange("is_sensitive", checked)
                }
              />
              <Label htmlFor="sensitive">センシティブコンテンツ</Label>
            </div>

            {/* 有料投稿 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="paid"
                  checked={formData.is_paid}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_paid", checked)
                  }
                />
                <Label htmlFor="paid">有料投稿</Label>
              </div>

              {formData.is_paid && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>価格（円）</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.price || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "price",
                          parseInt(e.target.value) || undefined
                        )
                      }
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label>紹介文</Label>
                    <Input
                      value={formData.introduction || ""}
                      onChange={(e) =>
                        handleInputChange("introduction", e.target.value)
                      }
                      placeholder="この投稿について..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="flex justify-end gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting || isUploading}
                >
                  キャンセル
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading}
                className="flex items-center gap-2"
              >
                <Repeat className="w-4 h-4" />
                {isSubmitting ? "投稿中..." : "投稿する"}
              </Button>
            </div>
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
        </Card>
      )}
    </>
  );
}
