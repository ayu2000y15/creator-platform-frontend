import api from "./api";

export interface Post {
  id: string;
  user_id: number;
  view_permission: "public" | "followers" | "mutuals";
  comment_permission: "public" | "followers" | "mutuals";
  is_sensitive: boolean;
  content_type: "video" | "short_video" | "text" | "quote";
  text_content?: string;
  quoted_post_id?: string;
  quoted_reply_id?: string;
  is_paid: boolean;
  price?: number;
  introduction?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    username?: string;
    profile_image?: string;
  };
  media?: Media[];
  quoted_post?: Post;
  quoted_reply?: {
    id: string;
    content: string;
    user: {
      id: number;
      name: string;
      username?: string;
      profile_image?: string;
    };
    post: {
      id: string;
      text_content?: string;
      user: {
        id: number;
        name: string;
        username?: string;
        profile_image?: string;
      };
    };
  };
  likes_count: number;
  sparks_count: number;
  bookmarks_count: number;
  replies_count: number;
  quotes_count: number;
  views_count: number;
  // ユーザーのアクション状態
  is_liked?: boolean;
  is_sparked?: boolean;
  is_bookmarked?: boolean;
  // リポスト情報
  is_repost?: boolean;
  repost_user?: {
    id: number;
    name: string;
    username?: string;
    profile_image?: string;
  };
  repost_created_at?: string;
  // コメント引用フラグ（フロントエンド用）
  __isCommentQuote?: boolean;
}

export interface Media {
  id: string;
  post_id: string;
  file_path: string;
  file_type: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Reply {
  id: string;
  user_id: number;
  post_id: string;
  parent_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    username?: string;
    profile_image?: string;
  };
  children?: Reply[];
}

export interface CreatePostData {
  content_type: "text" | "video" | "short_video" | "quote";
  text_content?: string;
  view_permission: "public" | "followers" | "mutuals";
  comment_permission: "public" | "followers" | "mutuals";
  is_sensitive?: boolean;
  quoted_post_id?: string;
  quoted_reply_id?: string;
  is_paid?: boolean;
  price?: number;
  introduction?: string;
  media?: FileList;
}

export interface UpdatePostData {
  text_content?: string;
  view_permission: "public" | "followers" | "mutuals";
  comment_permission: "public" | "followers" | "mutuals";
  is_sensitive?: boolean;
  price?: number;
  introduction?: string;
}

export interface CreateReplyData {
  content: string;
}

export const postApi = {
  // 投稿一覧取得
  getPosts: async (
    cursor?: string,
    filter?: "recommend" | "following" | "short" | "paid"
  ): Promise<{
    data: Post[];
    next_cursor?: string;
    prev_cursor?: string;
  }> => {
    const params: Record<string, string> = {};
    if (cursor) params.cursor = cursor;
    if (filter) params.filter = filter;
    const response = await api.get("/posts", { params });
    return response.data;
  },

  // 投稿詳細取得
  getPost: async (postId: string): Promise<Post> => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  // 投稿作成
  createPost: async (data: CreatePostData): Promise<Post> => {
    const formData = new FormData();

    formData.append("content_type", data.content_type);
    formData.append("view_permission", data.view_permission);
    formData.append("comment_permission", data.comment_permission);

    if (data.text_content) formData.append("text_content", data.text_content);
    if (data.quoted_post_id)
      formData.append("quoted_post_id", data.quoted_post_id);
    if (data.quoted_reply_id)
      formData.append("quoted_reply_id", data.quoted_reply_id);
    if (data.is_sensitive) formData.append("is_sensitive", "1");
    if (data.is_paid) formData.append("is_paid", "1");
    if (data.price) formData.append("price", data.price.toString());
    if (data.introduction) formData.append("introduction", data.introduction);

    if (data.media) {
      Array.from(data.media).forEach((file, index) => {
        formData.append(`media[${index}]`, file);
      });
    }

    const response = await api.post("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 投稿更新
  updatePost: async (postId: string, data: UpdatePostData): Promise<Post> => {
    const response = await api.put(`/posts/${postId}`, data);
    return response.data;
  },

  // 投稿削除
  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  },

  // いいね
  likePost: async (
    postId: string
  ): Promise<{
    message: string;
    is_liked?: boolean;
    likes_count?: number;
  }> => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  // いいね取り消し
  unlikePost: async (
    postId: string
  ): Promise<{
    message: string;
    is_liked?: boolean;
    likes_count?: number;
  }> => {
    const response = await api.delete(`/posts/${postId}/like`);
    return response.data;
  },

  // スパーク
  sparkPost: async (
    postId: string
  ): Promise<{
    message: string;
    is_sparked: boolean;
    sparks_count: number;
  }> => {
    const response = await api.post(`/posts/${postId}/spark`);
    return response.data;
  },

  // スパーク取り消し
  unsparkPost: async (
    postId: string
  ): Promise<{
    message: string;
    is_sparked: boolean;
    sparks_count: number;
  }> => {
    const response = await api.delete(`/posts/${postId}/spark`);
    return response.data;
  },

  // ブックマーク
  bookmarkPost: async (
    postId: string
  ): Promise<{
    message: string;
    is_bookmarked?: boolean;
    bookmarks_count?: number;
  }> => {
    const response = await api.post(`/posts/${postId}/bookmark`);
    return response.data;
  },

  // ブックマーク取り消し
  unbookmarkPost: async (
    postId: string
  ): Promise<{
    message: string;
    is_bookmarked?: boolean;
    bookmarks_count?: number;
  }> => {
    const response = await api.delete(`/posts/${postId}/bookmark`);
    return response.data;
  },

  // 閲覧履歴記録
  viewPost: async (postId: string): Promise<void> => {
    await api.post(`/posts/${postId}/view`);
  },

  // リプライ一覧取得
  getReplies: async (
    postId: string,
    page = 1
  ): Promise<{
    data: Reply[];
    current_page: number;
    last_page: number;
  }> => {
    const response = await api.get(`/posts/${postId}/replies`, {
      params: { page },
    });
    return response.data;
  },

  // 投稿にリプライ
  replyToPost: async (
    postId: string,
    data: CreateReplyData
  ): Promise<Reply> => {
    const response = await api.post(`/posts/${postId}/replies`, data);
    return response.data;
  },

  // リプライにリプライ
  replyToReply: async (
    replyId: string,
    data: CreateReplyData
  ): Promise<Reply> => {
    const response = await api.post(`/replies/${replyId}/replies`, data);
    return response.data;
  },

  // リプライ更新
  updateReply: async (
    replyId: string,
    data: CreateReplyData
  ): Promise<Reply> => {
    const response = await api.put(`/replies/${replyId}`, data);
    return response.data;
  },

  // リプライ削除
  deleteReply: async (replyId: string): Promise<void> => {
    await api.delete(`/replies/${replyId}`);
  },
};
