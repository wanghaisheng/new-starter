import { createAuthClient } from "better-auth/client";
import { AuthError, AuthSession } from "@/core/services/infrastructure/auth/types/auth-service";
import { User } from "@/core/lib/db/types/user";
import { useCallback, useEffect, useState } from "react";

// 类型定义
export type SignInOptions = { email: string; password: string; };
export type SignUpOptions = { email: string; password: string; name: string; image?: string; };
export type UpdateProfileOptions = { name?: string; image?: string; };

// 类型声明增强，严格对齐 better-auth 官方 API
export type BetterAuthClient = {
  signIn: (opts: SignInOptions) => Promise<{ user: any; token: string }>;
  signUp: (opts: SignUpOptions) => Promise<{ user: any; token: string }>;
  signOut: () => Promise<void>;
  getSession: () => Promise<{ user: any; token: string } | null>;
  socialSignIn: (opts: { provider: string; token: string; }) => Promise<{ user: any; token: string }>;
  updateUser: (opts: UpdateProfileOptions) => Promise<{ status: boolean; data: any; error: any; }>;
  // 其它方法可按需补充
  [key: string]: any;
};

// 初始化客户端（类型断言为官方 API 类型）
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_API_URL || "/api/auth",
  debug: process.env.NODE_ENV === "development",
}) as BetterAuthClient;

// 用户映射（如需自定义 User 类型，可在此扩展）
function mapAuthUserToUser(authUser: any): User {
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.name,
    emailVerified: authUser.emailVerified || false,
    createdAt: new Date(authUser.createdAt),
    updatedAt: new Date(authUser.updatedAt),
    // Required fields with default values
    birthDate: new Date(),
    gender: 'other',
    photos: [],
    interests: [],
    location: {
      latitude: 0,
      longitude: 0,
      city: '',
      country: '',
    },
    privacySettings: {
      showProfileToEveryone: true,
      showOnlineStatus: true,
      showLastActive: true,
      showInDiscovery: true,
      showDistance: true,
      allowDataCollection: true,
      allowPersonalizedAds: true,
      showEmailToMatches: false,
      showPhoneToMatches: false,
      allowProfileSharing: true,
    },
    preferences: {
      ageRange: { min: 18, max: 100 },
      distance: 50,
      gender: ['male', 'female', 'other'],
      interests: [],
    },
    notificationSettings: {
      newMatches: true,
      matchMessages: true,
      profileViews: true,
      profileLikes: true,
      appUpdates: true,
      promotions: true,
    },
    matching: {
      completedTests: [],
      testWeights: {},
      testResults: {},
    },
    isVerified: false,
    lastActive: new Date(),
    isOnline: false,
    status: 'active',
  };
}

// getCurrentUser/refreshToken 业务适配
export async function getCurrentUser() {
  const session = await authClient.getSession();
  return session?.user || null;
}
export async function refreshToken() {
  const session = await authClient.getSession();
  return session?.token || "";
}

// 导出常用方法
export const {
  signIn,
  signUp,
  signOut,
  getSession,
  socialSignIn,
} = authClient;

// React hooks for auth
export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.user) {
          setSession({
            user: mapAuthUserToUser(session.user),
            token: session.token || "",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          });
        }
      } catch (err) {
        setError(err as AuthError);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (options: SignInOptions) => {
    try {
      setLoading(true);
      const session = await authClient.signIn(options);
      if (session?.user) {
        setSession({
          user: mapAuthUserToUser(session.user),
          token: session.token || "",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }
      return session;
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (options: SignUpOptions) => {
    try {
      setLoading(true);
      const session = await authClient.signUp(options);
      if (session?.user) {
        setSession({
          user: mapAuthUserToUser(session.user),
          token: session.token || "",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        });
      }
      return session;
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await authClient.signOut();
      setSession(null);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in with social provider
  const socialSignIn = useCallback(async (provider: string, token: string) => {
    try {
      setLoading(true);
      if (typeof authClient.socialSignIn !== 'function') throw new Error('socialSignIn not implemented');
      const session = await authClient.socialSignIn({ provider, token });
      if (session?.user) {
        setSession({
          user: mapAuthUserToUser(session.user),
          token: session.token || "",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }
      return session;
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (options: UpdateProfileOptions) => {
    try {
      setLoading(true);
      const { data, error } = await authClient.updateUser(options);
      if (error) throw error;
      if (session && data?.status) {
        // Keep the existing session but update the user data
        setSession({
          ...session,
          user: {
            ...session.user,
            ...options,
          },
        });
      }
      return data;
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  return {
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    socialSignIn,
    updateProfile,
  };
}