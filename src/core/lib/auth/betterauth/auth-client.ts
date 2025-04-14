'use client';

import { createAuthClient } from "better-auth/client";
import { useCallback, useEffect, useState } from "react";
import { AuthError, AuthSession } from "@/core/services/auth/auth-types";
import { User } from "@/core/lib/db/types/user";

// Initialize the auth client
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_API_URL || "/api/auth",
  debug: process.env.NODE_ENV === "development",
});

// Types for better-auth client
export type SignInOptions = {
  email: string;
  password: string;
};

export type SignUpOptions = {
  email: string;
  password: string;
  name: string;
  image?: string;
};

export type UpdateProfileOptions = {
  name?: string;
  image?: string;
};

// Map better-auth user to our User type
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

// React hooks for auth
export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data, error } = await authClient.getSession();
        if (error) throw error;
        if (data?.user) {
          setSession({
            user: mapAuthUserToUser(data.user),
            token: data.session?.token || "",
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
      const { data, error } = await authClient.signIn.email(options);
      if (error) throw error;
      if (data?.user) {
        setSession({
          user: mapAuthUserToUser(data.user),
          token: data.token || "",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        });
      }
      return data;
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
      const { data, error } = await authClient.signUp.email(options);
      if (error) throw error;
      if (data?.user) {
        setSession({
          user: mapAuthUserToUser(data.user),
          token: data.token || "",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        });
      }
      return data;
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
      const { error } = await authClient.signOut();
      if (error) throw error;
      setSession(null);
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
    updateProfile,
  };
}

// Export methods for convenience
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient; 