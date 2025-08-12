import api from "./api"

export interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  two_factor_enabled?: boolean
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  user: User
  token: string
  two_factor?: boolean
}

export interface RegisterData {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface RegisterWithEmailData {
  email: string
}

export interface VerifyEmailAndCompleteRegistrationData {
  email: string
  code: string
  name: string
  password: string
  password_confirmation: string
}

export interface LoginData {
  email: string
  password: string
}

export interface TwoFactorChallengeData {
  email: string
  code: string
}

export const authApi = {
  // ユーザー登録
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post("/register", data)
    return response.data
  },

  registerWithEmail: async (data: RegisterWithEmailData): Promise<void> => {
    await api.post("/register/email", data)
  },

  verifyEmailAndCompleteRegistration: async (data: VerifyEmailAndCompleteRegistrationData): Promise<LoginResponse> => {
    const response = await api.post("/register/verify", data)
    return response.data
  },

  // ログイン
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post("/login", data)
    return response.data
  },

  // 二段階認証チャレンジ
  twoFactorChallenge: async (data: TwoFactorChallengeData): Promise<LoginResponse> => {
    const response = await api.post("/two-factor-challenge", data)
    return response.data
  },

  // ログアウト
  logout: async (): Promise<void> => {
    await api.post("/logout")
  },

  // ユーザー情報取得
  getUser: async (): Promise<User> => {
    const response = await api.get("/user")
    return response.data
  },

  // 二段階認証有効化
  enableTwoFactor: async (): Promise<any> => {
    const response = await api.post("/user/two-factor-authentication")
    return response.data
  },

  // 二段階認証無効化
  disableTwoFactor: async (): Promise<void> => {
    await api.delete("/user/two-factor-authentication")
  },

  // Googleログインリダイレクト
  getGoogleRedirectUrl: (): string => {
    return `${process.env.NEXT_PUBLIC_API_URL}/auth/google/redirect`
  },
}
