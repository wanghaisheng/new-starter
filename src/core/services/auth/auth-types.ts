import { User } from '@/core/lib/db/types/user';

export type AuthProviderType = 'emailAndPassword' | 'phone' | 'google' | 'facebook' | 'apple';
export type AuthServiceType = 'better' | 'firebase' | 'mock';

export interface PhoneAuthCredentials {
  phoneNumber: string;
  verificationCode?: string;
}

export interface SocialAuthCredentials {
  provider: AuthProviderType;
  token: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface AuthConfig {
  emailAndPassword: {
    enabled: boolean;
    requireEmailVerification?: boolean;
    minPasswordLength?: number;
    maxPasswordLength?: number;
    resetPasswordTokenExpiresIn?: number;
    password?: {
      hash(password: string): Promise<string>;
      verify(password: string, hash: string): Promise<boolean>;
    };
    sendResetPassword?(context: EmailContext, request: RequestContext): Promise<void>;
    sendVerificationEmail?(context: EmailContext, request: RequestContext): Promise<void>;
  };
  phone: {
    enabled: boolean;
    [key: string]: any;
  };
  google: {
    enabled: boolean;
    [key: string]: any;
  };
  facebook: {
    enabled: boolean;
    [key: string]: any;
  };
  apple: {
    enabled: boolean;
    [key: string]: any;
  };
}

export interface EmailContext {
  user: User;
  url: string;
  token: string;
}

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export interface IAuthDataService {
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPhone(phoneNumber: string): Promise<User | null>;
  createUser(data: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

export interface AuthProvider {
  initialize(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  signInWithEmail(email: string, password: string): Promise<User>;
  signInWithPhone(credentials: PhoneAuthCredentials): Promise<User>;
  signInWithProvider(provider: AuthProviderType): Promise<User>;
  signOut(): Promise<void>;
  updateProfile(userData: Partial<User>): Promise<User>;
  sendPhoneVerificationCode(phoneNumber: string): Promise<void>;
  refreshToken(): Promise<string>;
  resetPassword(email: string): Promise<void>;
  sendEmailVerification(): Promise<void>;
  verifyEmail(code: string): Promise<void>;
  createUser(data: Partial<User>): Promise<User>;
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPhone(phoneNumber: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
} 