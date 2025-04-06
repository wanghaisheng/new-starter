import { User as FullUser } from '@/core/lib/db/types/user';
import { BetterAuthService } from './better-auth-service';
import { FirebaseAuthService } from './firebase-auth-service';
import { MockAuthService } from './mock-auth-service';
import { getAuthServiceType } from '@/core/config/auth-config';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 认证服务接口
 * 定义所有认证服务必须实现的方法
 */
export interface IAuthService {
  /**
   * 使用邮箱和密码登录
   * @param email 用户邮箱
   * @param password 用户密码
   * @returns 登录成功的用户信息
   */
  login(email: string, password: string): Promise<User>;

  /**
   * 使用手机号和验证码登录
   * @param phoneNumber 手机号码
   * @param verificationCode 验证码
   * @returns 登录成功的用户信息
   */
  loginWithPhone(phoneNumber: string, verificationCode: string): Promise<User>;

  /**
   * 发送验证码到指定手机号
   * @param phoneNumber 手机号码
   */
  sendVerificationCode(phoneNumber: string): Promise<void>;

  /**
   * 登出当前用户
   */
  logout(): Promise<void>;

  /**
   * 获取当前登录用户
   * @returns 当前登录用户，如果未登录则返回null
   */
  getCurrentUser(): User | null;

  /**
   * 检查用户是否已认证
   * @returns 是否已认证
   */
  isAuthenticated(): boolean;

  /**
   * 更新用户资料
   * @param userData 要更新的用户数据
   * @returns 更新后的用户信息
   */
  updateProfile(userData: Partial<User>): Promise<User>;

  /**
   * 发送密码重置邮件
   * @param email 用户邮箱
   */
  sendPasswordResetEmail(email: string): Promise<void>;

  /**
   * 验证密码重置代码
   * @param code 重置代码
   * @returns 重置代码对应的邮箱地址
   */
  verifyPasswordResetCode(code: string): Promise<string>;

  /**
   * 确认密码重置
   * @param code 重置代码
   * @param newPassword 新密码
   */
  confirmPasswordReset(code: string, newPassword: string): Promise<void>;

  /**
   * 发送邮箱验证邮件
   */
  sendEmailVerification(): Promise<void>;

  /**
   * 应用邮箱验证代码
   * @param code 验证代码
   */
  applyActionCode(code: string): Promise<void>;

  /**
   * 更新用户邮箱
   * @param newEmail 新邮箱地址
   */
  updateEmail(newEmail: string): Promise<void>;

  /**
   * 更新用户密码
   * @param newPassword 新密码
   */
  updatePassword(newPassword: string): Promise<void>;
}

/**
 * 认证服务类型
 */
export type AuthServiceType = 'better' | 'firebase' | 'mock';

/**
 * 认证服务工厂
 * 用于创建和管理不同类型的认证服务实例
 */
export class AuthServiceFactory {
  private static instance: AuthServiceFactory | null = null;
  private authService: IAuthService | null = null;
  private serviceType: AuthServiceType = 'better';

  private constructor() {}

  /**
   * 获取工厂实例
   */
  public static getInstance(): AuthServiceFactory {
    if (!AuthServiceFactory.instance) {
      AuthServiceFactory.instance = new AuthServiceFactory();
    }
    return AuthServiceFactory.instance;
  }

  /**
   * 设置认证服务类型
   * @param type 认证服务类型
   */
  public setServiceType(type: AuthServiceType): void {
    this.serviceType = type;
    this.authService = null; // 重置服务实例
  }

  /**
   * 获取认证服务实例
   * @returns 认证服务实例
   */
  public getAuthService(): IAuthService {
    if (!this.authService) {
      switch (this.serviceType) {
        case 'better':
          this.authService = BetterAuthService.getInstance();
          break;
        case 'firebase':
          this.authService = FirebaseAuthService.getInstance();
          break;
        case 'mock':
          this.authService = MockAuthService.getInstance();
          break;
        default:
          throw new Error(`Unsupported auth service type: ${this.serviceType}`);
      }
    }
    return this.authService;
  }

  /**
   * 重置认证服务实例
   * 用于测试或切换认证服务类型
   */
  public resetAuthService(): void {
    this.authService = null;
  }
}

export type User = FullUser;

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

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