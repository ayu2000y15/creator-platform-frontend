"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  authApi,
  type User,
  type TwoFactorChallengeData,
  type UpdateProfileData,
  type ChangePasswordData,
} from "@/lib/auth-api";

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{
    requiresTwoFactor?: boolean;
    twoFactorMethod?: "app" | "email";
  }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string) => Promise<void>;
  verifyEmailAndCompleteRegistration: (
    email: string,
    code: string,
    name: string,
    password: string,
    birthday?: string,
    phone_number?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  twoFactorChallenge: (data: TwoFactorChallengeData) => Promise<void>;
  emailTwoFactorChallenge: (email: string, code: string) => Promise<void>;
  enableTwoFactor: () => Promise<any>;
  disableTwoFactor: () => Promise<void>;
  enableEmailTwoFactor: () => Promise<void>;
  disableEmailTwoFactor: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  uploadProfileImage: (file: File) => Promise<string>;
  deleteProfileImage: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  requiresTwoFactor: boolean;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  verifyEmail: (id: string, hash: string, signature: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const userData = await authApi.getUser();
          setUser(userData);
        } catch (error: any) {
          console.log("Token validation failed:", error?.response?.status);
          // トークンが無効な場合のみクリア
          if (
            error?.response?.status === 401 ||
            error?.response?.status === 403
          ) {
            localStorage.removeItem("auth_token");
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Login attempt:", { email, password: "***" });

      const response = await authApi.login({ email, password });

      if (response.two_factor) {
        setRequiresTwoFactor(true);
        const twoFactorMethod = response.two_factor_method || "app";
        return { requiresTwoFactor: true, twoFactorMethod };
      }

      localStorage.setItem("auth_token", response.token);
      setUser(response.user);
      setRequiresTwoFactor(false);
      return {};
    } catch (error: any) {
      console.error("Login error details:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        errors: error.response?.data?.errors,
        data: error.response?.data,
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.register({
        name,
        email,
        password,
        password_confirmation: password,
      });

      localStorage.setItem("auth_token", response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const registerWithEmail = async (email: string) => {
    try {
      await authApi.registerWithEmail({ email });
    } catch (error) {
      throw error;
    }
  };

  const verifyEmailAndCompleteRegistration = async (
    email: string,
    code: string,
    name: string,
    password: string,
    birthday?: string,
    phone_number?: string
  ) => {
    try {
      const response = await authApi.verifyEmailAndCompleteRegistration({
        email,
        code,
        name,
        password,
        password_confirmation: password,
        birthday,
        phone_number,
      });

      localStorage.setItem("auth_token", response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const twoFactorChallenge = async (data: TwoFactorChallengeData) => {
    try {
      const response = await authApi.twoFactorChallenge(data);
      localStorage.setItem("auth_token", response.token);
      setUser(response.user);
      setRequiresTwoFactor(false);
    } catch (error) {
      throw error;
    }
  };

  const emailTwoFactorChallenge = async (email: string, code: string) => {
    try {
      const response = await authApi.verifyEmailTwoFactorCode({ email, code });
      localStorage.setItem("auth_token", response.token);
      setUser(response.user);
      setRequiresTwoFactor(false);
    } catch (error) {
      throw error;
    }
  };

  const enableTwoFactor = async () => {
    try {
      if (user?.email_two_factor_enabled) {
        await authApi.disableEmailTwoFactor();
      }

      const response = await authApi.enableTwoFactor();
      if (user) {
        setUser({
          ...user,
          two_factor_enabled: true,
          email_two_factor_enabled: false,
        });
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const disableTwoFactor = async () => {
    try {
      if (user?.two_factor_confirmed_at) {
        await authApi.disableTwoFactor();
      }
      if (user?.email_two_factor_enabled) {
        await authApi.disableEmailTwoFactor();
      }

      if (user) {
        setUser({
          ...user,
          two_factor_enabled: false,
          two_factor_confirmed_at: null,
          email_two_factor_enabled: false,
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const enableEmailTwoFactor = async () => {
    try {
      if (user?.two_factor_confirmed_at) {
        await authApi.disableTwoFactor();
      }

      await authApi.enableEmailTwoFactor();
      if (user) {
        setUser({
          ...user,
          email_two_factor_enabled: true,
          two_factor_confirmed_at: null,
          two_factor_enabled: false,
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const disableEmailTwoFactor = async () => {
    try {
      await authApi.disableEmailTwoFactor();
      if (user) {
        setUser({ ...user, email_two_factor_enabled: false });
      }
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
    try {
      await authApi.changePassword(data);
    } catch (error) {
      throw error;
    }
  };

  const uploadProfileImage = async (file: File) => {
    try {
      const imageUrl = await authApi.uploadProfileImage(file);
      if (user) {
        setUser({ ...user, profile_image: imageUrl });
      }
      return imageUrl;
    } catch (error) {
      throw error;
    }
  };

  const deleteProfileImage = async () => {
    try {
      await authApi.deleteProfileImage();
      if (user) {
        setUser({ ...user, profile_image: null });
      }
    } catch (error) {
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getUser();
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      localStorage.removeItem("auth_token");
      setUser(null);
      setRequiresTwoFactor(false);
    }
  };

  const resendVerificationEmail = async () => {
    try {
      await authApi.resendVerificationEmail();
    } catch (error) {
      throw error;
    }
  };

  const checkEmailVerification = async () => {
    try {
      const result = await authApi.checkEmailVerification();
      return result.verified;
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (id: string, hash: string, signature: string) => {
    try {
      await authApi.verifyEmail(id, hash, signature);
      await refreshUser();
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    registerWithEmail,
    verifyEmailAndCompleteRegistration,
    logout,
    twoFactorChallenge,
    emailTwoFactorChallenge,
    enableTwoFactor,
    disableTwoFactor,
    enableEmailTwoFactor,
    disableEmailTwoFactor,
    updateProfile,
    changePassword,
    uploadProfileImage,
    deleteProfileImage,
    refreshUser,
    loading,
    isAuthenticated: !!user,
    requiresTwoFactor,
    resendVerificationEmail,
    checkEmailVerification,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
