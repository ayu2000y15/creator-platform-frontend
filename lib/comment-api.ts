import api from "./api";

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string; // parent_comment_id から parent_id に変更
  created_at: string;
  updated_at: string;
  likes_count?: number; // いいね数
  sparks_count?: number; // スパーク数
  quotes_count?: number; // 引用数
  is_liked?: boolean; // 現在のユーザーがいいねしているか
  is_sparked?: boolean; // 現在のユーザーがスパークしているか
  user?: {
    id: number;
    name: string;
    display_name?: string;
    username?: string;
    profile_image?: string;
  };
  replies?: Comment[]; // 子コメント
}

export interface CreateCommentRequest {
  content: string;
}

export interface CreateReplyRequest {
  content: string;
  parent_comment_id: string;
}

export interface QuoteCommentRequest {
  text_content: string;
  view_permission: "public" | "followers" | "mutuals";
  comment_permission: "public" | "followers" | "mutuals";
  is_sensitive?: boolean;
}

export const commentApi = {
  // コメント一覧取得（リプライAPIを使用）
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const response = await api.get(`/posts/${postId}/replies`);
      console.log("API Response:", response.data);

      // レスポンスが配列かページネーション形式かを判定
      let replies: Comment[];

      if (Array.isArray(response.data)) {
        // 直接配列の場合
        replies = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // ページネーション形式の場合
        replies = response.data.data;
      } else {
        console.warn("Unexpected response format:", response.data);
        return [];
      }

      if (!Array.isArray(replies)) {
        console.warn("Replies is not an array:", replies);
        return [];
      }

      // ツリー構造に変換
      const tree = this.buildCommentTree(replies);
      console.log("Comment tree:", tree);
      return tree;
    } catch (error) {
      console.error("Failed to get comments:", error);
      throw error;
    }
  },

  // フラットなリプライ配列をツリー構造に変換
  buildCommentTree(replies: Comment[]): Comment[] {
    console.log("Building tree from replies:", replies);

    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // まずすべてのコメントをMapに格納
    replies.forEach((reply) => {
      commentMap.set(reply.id, { ...reply, replies: [] });
    });

    console.log("Comment map:", commentMap);

    // 親子関係を構築
    replies.forEach((reply) => {
      const comment = commentMap.get(reply.id);
      if (!comment) return;

      if (reply.parent_id) {
        // 子コメントの場合、親に追加
        const parent = commentMap.get(reply.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
          console.log(`Added child ${reply.id} to parent ${reply.parent_id}`);
        } else {
          console.warn(
            `Parent ${reply.parent_id} not found for reply ${reply.id}`
          );
        }
      } else {
        // 親コメントの場合、ルートに追加
        rootComments.push(comment);
        console.log(`Added root comment ${reply.id}`);
      }
    });

    console.log("Root comments:", rootComments);
    return rootComments;
  },

  // コメント作成（投稿へのリプライとして作成）
  async createComment(postId: string, content: string): Promise<Comment> {
    const response = await api.post(`/posts/${postId}/replies`, {
      content,
    });
    return response.data;
  },

  // 返信作成（リプライへのリプライとして作成）
  async createReply(
    parentCommentId: string,
    content: string
  ): Promise<Comment> {
    const response = await api.post(`/replies/${parentCommentId}/replies`, {
      content,
    });
    return response.data;
  },

  // コメント削除
  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/replies/${commentId}`);
  },

  // コメント編集
  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await api.put(`/replies/${commentId}`, {
      content,
    });
    return response.data;
  },

  // コメントにいいね
  async likeComment(commentId: string): Promise<void> {
    await api.post(`/replies/${commentId}/like`);
  },

  // コメントのいいねを取り消し
  async unlikeComment(commentId: string): Promise<void> {
    await api.delete(`/replies/${commentId}/like`);
  },

  // コメントにスパーク
  async sparkComment(commentId: string): Promise<void> {
    await api.post(`/replies/${commentId}/spark`);
  },

  // コメントのスパークを取り消し
  async unsparkComment(commentId: string): Promise<void> {
    await api.delete(`/replies/${commentId}/spark`);
  },

  // コメントを引用投稿として作成
  async quoteComment(
    commentId: string,
    quoteData: QuoteCommentRequest
  ): Promise<any> {
    const response = await api.post(`/replies/${commentId}/quote`, quoteData);
    return response.data;
  },
};
