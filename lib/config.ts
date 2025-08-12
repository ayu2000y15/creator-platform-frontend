export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};

// 環境に応じたAPI URLの自動設定
export const getApiUrl = () => {
  // 本番環境でAPI URLが設定されていない場合の自動検出
  if (config.isProduction && !process.env.NEXT_PUBLIC_API_URL) {
    // Vercelの場合の自動設定例
    if (process.env.VERCEL_URL) {
      return `https://api-${process.env.VERCEL_URL}/api`;
    }
  }
  return config.apiUrl;
};
