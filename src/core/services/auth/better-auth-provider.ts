import { logger } from '@/core/lib/logger';
import { User } from '@/core/lib/db/types/user';
import { authConfig } from './auth-config';
import { 
  AuthProviderType,
  AuthProvider,
  PhoneAuthCredentials,
  AuthError,
  AuthSession
} from './auth-types';
import { authClient, SignInOptions, SignUpOptions, UpdateProfileOptions } from '@/core/lib/auth/betterauth/auth-client';

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
    isVerified: authUser.emailVerified || false,
    lastActive: new Date(),
    isOnline: false,
    status: 'active',
  };
}

export class BetterAuthProvider implements AuthProvider {
  private static instance: BetterAuthProvider;
  private currentUser: User | null = null;
  private initialized = false;
  private session: AuthSession | null = null;

  private constructor() {}

  static getInstance(): BetterAuthProvider {
    if (!BetterAuthProvider.instance) {
      BetterAuthProvider.instance = new BetterAuthProvider();
    }
    return BetterAuthProvider.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const { data, error } = await authClient.getSession();
      
      if (error) {
        throw new AuthError(error.message || 'Session error', 'auth/session-error');
      }
      
      if (data?.user) {
        this.currentUser = mapAuthUserToUser(data.user);
        this.session = {
          user: this.currentUser,
          token: data.session?.token || "",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        };
        logger.info('User session restored', { userId: this.currentUser.id });
      }
    } catch (error) {
      logger.error('Failed to initialize auth provider', { error });
    } finally {
      this.initialized = true;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    await this.ensureInitialized();
    return this.currentUser;
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    await this.ensureInitialized();
    
    if (!authConfig.emailAndPassword.enabled) {
      throw new AuthError('Email authentication is not enabled', 'auth/email-auth-disabled');
    }

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      } as SignInOptions);
      
      if (error || !data?.user) {
        throw new AuthError(error?.message || 'Authentication failed', 'auth/unknown-error');
      }
      
      this.currentUser = mapAuthUserToUser(data.user);
      this.session = {
        user: this.currentUser,
        token: data.token || "",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      };
      
      logger.info('User signed in with email', { userId: this.currentUser.id });
      return this.currentUser;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('Email sign in failed', { error, email });
      throw new AuthError('Authentication failed', 'auth/unknown-error');
    }
  }

  async signInWithPhone(credentials: PhoneAuthCredentials): Promise<User> {
    await this.ensureInitialized();
    
    try {
      // Phone authentication requires a plugin
      throw new AuthError('Phone authentication requires the phone plugin', 'auth/phone-auth-not-configured');
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('Phone sign in failed', { error, phoneNumber: credentials.phoneNumber });
      throw new AuthError('Authentication failed', 'auth/unknown-error');
    }
  }

  async signInWithProvider(provider: AuthProviderType): Promise<User> {
    await this.ensureInitialized();
    
    try {
      const { data, error } = await authClient.signIn.social({
        provider: provider as "github" | "google",
        callbackURL: '/dashboard',
        errorCallbackURL: '/error',
      });
      
      if (error) {
        throw new AuthError(error.message || 'Authentication failed', 'auth/unknown-error');
      }
      
      // Social sign in will redirect, so we don't handle the user here
      throw new AuthError('Social sign in requires redirect', 'auth/redirect-required');
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('Social sign in failed', { error, provider });
      throw new AuthError('Authentication failed', 'auth/unknown-error');
    }
  }

  async signOut(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const { error } = await authClient.signOut();
      
      if (error) {
        throw new AuthError(error.message || 'Sign out failed', 'auth/sign-out-failed');
      }
      
      this.currentUser = null;
      this.session = null;
      logger.info('User signed out');
    } catch (error) {
      logger.error('Sign out failed', { error });
      throw new AuthError('Sign out failed', 'auth/sign-out-failed');
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    await this.ensureInitialized();
    
    if (!this.currentUser) {
      throw new AuthError('No user is signed in', 'auth/no-user');
    }

    try {
      const { data, error } = await authClient.updateUser({
        name: userData.name,
        image: userData.avatar || userData.photoURL,
      } as UpdateProfileOptions);
      
      if (error || !data?.status) {
        throw new AuthError(error?.message || 'Profile update failed', 'auth/profile-update-failed');
      }
      
      // Update current user with new data
      this.currentUser = {
        ...this.currentUser,
        ...userData,
      };
      
      // Update session if it exists
      if (this.session) {
        this.session.user = this.currentUser;
      }
      
      logger.info('User profile updated', { userId: this.currentUser.id });
      return this.currentUser;
    } catch (error) {
      logger.error('Profile update failed', { error, userId: this.currentUser.id });
      throw new AuthError('Profile update failed', 'auth/profile-update-failed');
    }
  }

  async sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Phone verification requires a plugin
      throw new AuthError('Phone verification requires the phone plugin', 'auth/phone-auth-not-configured');
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      logger.error('Failed to send phone verification code', { error, phoneNumber });
      throw new AuthError('Failed to send verification code', 'auth/unknown-error');
    }
  }

  async refreshToken(): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.session) {
      throw new AuthError('No active session', 'auth/no-session');
    }

    try {
      const { data, error } = await authClient.getSession();
      
      if (error || !data?.session?.token) {
        throw new AuthError(error?.message || 'Token refresh failed', 'auth/token-refresh-failed');
      }
      
      this.session.token = data.session.token;
      this.session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      logger.info('Session token refreshed', { userId: this.currentUser?.id });
      return data.session.token;
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw new AuthError('Token refresh failed', 'auth/token-refresh-failed');
    }
  }

  async resetPassword(email: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!authConfig.emailAndPassword.enabled) {
      throw new AuthError('Email authentication is not enabled', 'auth/email-auth-disabled');
    }

    try {
      // Note: This is a placeholder. The actual implementation would depend on the better-auth client's API
      throw new AuthError('Password reset is not implemented', 'auth/not-implemented');
    } catch (error) {
      logger.error('Password reset failed', { error, email });
      throw new AuthError('Password reset failed', 'auth/password-reset-failed');
    }
  }

  async sendEmailVerification(): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.currentUser) {
      throw new AuthError('No user is signed in', 'auth/no-user');
    }

    if (!authConfig.emailAndPassword.enabled) {
      throw new AuthError('Email authentication is not enabled', 'auth/email-auth-disabled');
    }

    try {
      // Note: This is a placeholder. The actual implementation would depend on the better-auth client's API
      throw new AuthError('Email verification is not implemented', 'auth/not-implemented');
    } catch (error) {
      logger.error('Failed to send verification email', { error, userId: this.currentUser.id });
      throw new AuthError('Failed to send verification email', 'auth/verification-email-failed');
    }
  }

  async verifyEmail(code: string): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.currentUser) {
      throw new AuthError('No user is signed in', 'auth/no-user');
    }

    if (!authConfig.emailAndPassword.enabled) {
      throw new AuthError('Email authentication is not enabled', 'auth/email-auth-disabled');
    }

    try {
      // Note: This is a placeholder. The actual implementation would depend on the better-auth client's API
      throw new AuthError('Email verification is not implemented', 'auth/not-implemented');
    } catch (error) {
      logger.error('Email verification failed', { error, userId: this.currentUser.id });
      throw new AuthError('Email verification failed', 'auth/email-verification-failed');
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}