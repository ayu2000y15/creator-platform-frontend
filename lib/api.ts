import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
})

// リクエストインターセプター（認証トークン付与とデバッグログ）
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  console.log("API Request:", {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    data: config.data,
    headers: config.headers,
  })

  return config
})

// レスポンスインターセプター（エラーハンドリングとデバッグログ）
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    })
    return response
  },
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message,
      errors: error.response?.data?.errors,
      data: error.response?.data,
    })

    if (error.response?.status === 401) {
      // 認証エラーの場合、トークンを削除
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token")

        // 初期化時のユーザー情報取得エラーの場合はリダイレクトしない
        const isInitialUserFetch = error.config?.url?.includes("/user") && error.config?.method === "get"

        if (!isInitialUserFetch) {
          // 通常のAPI呼び出しでの401エラーの場合のみリダイレクト
          window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
