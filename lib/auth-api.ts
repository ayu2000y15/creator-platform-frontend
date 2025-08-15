import api from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  username?: string | null;
  bio?: string | null;
  profile_image?: string | null;
  birthday?: string | null;
  birthday_visibility?: "full" | "month_day" | "hidden";
  phone_number?: string | null;
  two_factor_enabled?: boolean;
  two_factor_confirmed_at?: string | null;
  email_two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  two_factor?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterWithEmailData {
  email: string;
}

export interface VerifyEmailAndCompleteRegistrationData {
  email: string;
  code: string;
  name: string;
  password: string;
  password_confirmation: string;
  birthday?: string;
  phone_number?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TwoFactorChallengeData {
  email: string;
  code: string;
}

export interface UpdateProfileData {
  name: string;
  email: string;
  username?: string;
  bio?: string;
  profile_image?: string;
  birthday?: string;
  birthday_visibility?: "full" | "month_day" | "hidden";
  phone_number?: string;
}

export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ConfirmTwoFactorData {
  code: string;
}

export interface SendVerificationEmailData {
  email?: string;
}

export interface EmailTwoFactorData {
  email: string;
  code: string;
}

export const authApi = {
  // ユーザー登録
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post("/register", data);
    return response.data;
  },

  registerWithEmail: async (data: RegisterWithEmailData): Promise<void> => {
    await api.post("/register/email", data);
  },

  verifyEmailAndCompleteRegistration: async (
    data: VerifyEmailAndCompleteRegistrationData
  ): Promise<LoginResponse> => {
    const response = await api.post("/register/verify", data);
    return response.data;
  },

  // ログイン
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post("/login", data);
    return response.data;
  },

  // 二段階認証チャレンジ
  twoFactorChallenge: async (
    data: TwoFactorChallengeData
  ): Promise<LoginResponse> => {
    const response = await api.post("/two-factor-challenge", data);
    return response.data;
  },

  // ログアウト
  logout: async (): Promise<void> => {
    await api.post("/logout");
  },

  // ユーザー情報取得
  getUser: async (): Promise<User> => {
    const response = await api.get("/user");
    return response.data;
  },

  // 二段階認証有効化
  enableTwoFactor: async (): Promise<any> => {
    const response = await api.post("/user/two-factor-authentication");
    return response.data;
  },

  getTwoFactorQrCode: async (): Promise<{ svg: string }> => {
    const response = await api.get("/user/two-factor-qr-code");
    return response.data;
  },

  getTwoFactorSecret: async (): Promise<{ secret: string }> => {
    const response = await api.get("/user/two-factor-secret");
    return response.data;
  },

  getTwoFactorRecoveryCodes: async (): Promise<{
    recovery_codes: string[];
  }> => {
    const response = await api.get("/user/two-factor-recovery-codes");
    return response.data;
  },

  regenerateTwoFactorRecoveryCodes: async (): Promise<{
    recovery_codes: string[];
  }> => {
    const response = await api.post("/user/two-factor-recovery-codes");
    return response.data;
  },

  // 二段階認証無効化
  disableTwoFactor: async (): Promise<void> => {
    await api.delete("/user/two-factor-authentication");
  },

  confirmTwoFactor: async (data: ConfirmTwoFactorData): Promise<void> => {
    await api.post("/user/confirmed-two-factor-authentication", data);
  },

  // Googleログインリダイレクト
  getGoogleRedirectUrl: (): string => {
    return `${process.env.NEXT_PUBLIC_API_URL}/auth/google/redirect`;
  },

  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await api.put("/user/profile", data);
    return response.data;
  },

  // パスワード変更
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await api.put("/user/password", data);
  },

  // メール認証状態確認
  checkEmailVerification: async (): Promise<{ verified: boolean }> => {
    const response = await api.get("/email/verification-notification");
    return response.data;
  },

  // 認証メール再送信
  resendVerificationEmail: async (): Promise<void> => {
    await api.post("/email/verification-notification");
  },

  // メール認証完了
  verifyEmail: async (
    id: string,
    hash: string,
    signature: string
  ): Promise<void> => {
    await api.get(`/email/verify/${id}/${hash}?signature=${signature}`);
  },

  // メール認証による二段階認証有効化
  enableEmailTwoFactor: async (): Promise<void> => {
    await api.post("/user/email-two-factor-authentication");
  },

  // メール認証による二段階認証無効化
  disableEmailTwoFactor: async (): Promise<void> => {
    await api.delete("/user/email-two-factor-authentication");
  },

  // ログイン時のメール認証コード送信
  sendEmailTwoFactorCode: async (email: string): Promise<void> => {
    await api.post("/email-two-factor-code", { email });
  },

  // メール認証コードの検証
  verifyEmailTwoFactorCode: async (
    data: EmailTwoFactorData
  ): Promise<LoginResponse> => {
    const response = await api.post("/email-two-factor-verify", data);
    return response.data;
  },

  uploadProfileImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post("/user/profile-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.image_url;
  },

  deleteProfileImage: async (): Promise<void> => {
    await api.delete("/user/profile-image");
  },
};
