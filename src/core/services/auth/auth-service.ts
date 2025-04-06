import { User } from '@/core/lib/db/types/user';
import { BetterAuthProvider } from './better-auth-provider';
import { FirebaseAuthProvider } from './firebase-auth-provider';
import { MockAuthProvider } from './mock-auth-provider';
import { getAuthServiceType } from '@/core/services/auth/auth-config';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  AuthError, 
  AuthProvider,
  PhoneAuthCredentials,
  SocialAuthCredentials,
  AuthProviderType
} from './auth-types';
import { logger } from '@/core/lib/logger';

/**
 * 认证状态接口
 */
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

/**
 * 认证状态存储
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

/**
 * 认证服务类
 * 提供统一的认证接口，委托具体实现给认证提供者
 */
export class AuthService {
  private static instance: AuthService;
  private provider: AuthProvider;

  private constructor() {
    const serviceType = getAuthServiceType();
    switch (serviceType) {
      case 'better':
        this.provider = BetterAuthProvider.getInstance();
        break;
      case 'firebase':
        this.provider = FirebaseAuthProvider.getInstance();
        break;
      case 'mock':
        this.provider = MockAuthProvider.getInstance();
        break;
      default:
        throw new Error(`Unsupported auth service type: ${serviceType}`);
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('初始化认证服务');
      await this.provider.initialize();
    } catch (error) {
      logger.error('初始化认证服务失败', { error });
      throw new AuthError('初始化认证服务失败', 'INIT_ERROR', error);
    }
  }

  // 邮箱密码登录
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      logger.info('用户邮箱登录', { email });
      return await this.provider.signInWithEmail(email, password);
    } catch (error) {
      logger.error('用户邮箱登录失败', { error, email });
      throw new AuthError('邮箱登录失败', 'EMAIL_SIGN_IN_ERROR', error);
    }
  }

  // 手机验证码登录
  async signInWithPhone(credentials: PhoneAuthCredentials): Promise<User> {
    try {
      logger.info('用户手机登录', { phoneNumber: credentials.phoneNumber });
      return await this.provider.signInWithPhone(credentials);
    } catch (error) {
      logger.error('用户手机登录失败', { error, phoneNumber: credentials.phoneNumber });
      throw new AuthError('手机登录失败', 'PHONE_SIGN_IN_ERROR', error);
    }
  }

  // 发送手机验证码
  async sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
    try {
      logger.info('发送手机验证码', { phoneNumber });
      await this.provider.sendPhoneVerificationCode(phoneNumber);
    } catch (error) {
      logger.error('发送手机验证码失败', { error, phoneNumber });
      throw new AuthError('发送验证码失败', 'SEND_CODE_ERROR', error);
    }
  }

  // 社交账号登录
  async signInWithProvider(provider: AuthProviderType): Promise<User> {
    try {
      logger.info('用户社交账号登录', { provider });
      return await this.provider.signInWithProvider(provider);
    } catch (error) {
      logger.error('用户社交账号登录失败', { error, provider });
      throw new AuthError('社交账号登录失败', 'SOCIAL_SIGN_IN_ERROR', error);
    }
  }

  // 登出
  async signOut(): Promise<void> {
    try {
      logger.info('用户登出');
      await this.provider.signOut();
    } catch (error) {
      logger.error('用户登出失败', { error });
      throw new AuthError('登出失败', 'SIGN_OUT_ERROR', error);
    }
  }

  // 获取当前用户
  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.provider.getCurrentUser();
    } catch (error) {
      logger.error('获取当前用户失败', { error });
      throw new AuthError('获取当前用户失败', 'GET_USER_ERROR', error);
    }
  }

  // 刷新令牌
  async refreshToken(): Promise<string> {
    try {
      return await this.provider.refreshToken();
    } catch (error) {
      logger.error('刷新令牌失败', { error });
      throw new AuthError('刷新令牌失败', 'REFRESH_TOKEN_ERROR', error);
    }
  }

  // 重置密码
  async resetPassword(email: string): Promise<void> {
    try {
      await this.provider.resetPassword(email);
    } catch (error) {
      logger.error('重置密码失败', { error, email });
      throw new AuthError('重置密码失败', 'RESET_PASSWORD_ERROR', error);
    }
  }

  // 更新用户资料
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      return await this.provider.updateProfile(data);
    } catch (error) {
      logger.error('更新用户资料失败', { error, data });
      throw new AuthError('更新用户资料失败', 'UPDATE_PROFILE_ERROR', error);
    }
  }

  // 发送邮箱验证
  async sendEmailVerification(): Promise<void> {
    try {
      await this.provider.sendEmailVerification();
    } catch (error) {
      logger.error('发送邮箱验证失败', { error });
      throw new AuthError('发送邮箱验证失败', 'SEND_EMAIL_VERIFICATION_ERROR', error);
    }
  }

  // 验证邮箱
  async verifyEmail(code: string): Promise<void> {
    try {
      await this.provider.verifyEmail(code);
    } catch (error) {
      logger.error('验证邮箱失败', { error });
      throw new AuthError('验证邮箱失败', 'VERIFY_EMAIL_ERROR', error);
    }
  }
} 