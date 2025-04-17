import { IService } from '../../types/base';
import { User } from '@/core/lib/db/types/user';

/**
 * 认证会话接口
 */
export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

/**
 * 手机认证凭证接口
 */
export interface PhoneAuthCredentials {
  phoneNumber: string;
  verificationCode: string;
}

/**
 * 认证服务接口
 */
export interface IAuthService extends IService {
  /**
   * 获取当前认证用户
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * 使用邮箱和密码登录
   */
  signInWithEmail(email: string, password: string): Promise<AuthSession>;

  /**
   * 使用手机号和验证码登录
   */
  signInWithPhone(credentials: PhoneAuthCredentials): Promise<AuthSession>;

  /**
   * 使用第三方提供者登录
   */
  signInWithProvider(provider: string): Promise<AuthSession>;

  /**
   * 使用邮箱和密码注册
   */
  signUpWithEmail(email: string, password: string, name: string): Promise<User>;

  /**
   * 登出当前用户
   */
  signOut(): Promise<void>;

  /**
   * 更新用户资料
   */
  updateProfile(userData: Partial<User>): Promise<User>;

  /**
   * 发送手机验证码
   */
  sendPhoneVerificationCode(phoneNumber: string): Promise<void>;

  /**
   * 刷新认证令牌
   */
  refreshToken(): Promise<string>;

  /**
   * 重置密码
   */
  resetPassword(email: string): Promise<void>;

  /**
   * 发送邮箱验证
   */
  sendEmailVerification(): Promise<void>;

  /**
   * 验证邮箱
   */
  verifyEmail(code: string): Promise<void>;

  /**
   * 创建用户
   */
  createUser(data: Partial<User>): Promise<User>;

  /**
   * 获取用户
   */
  getUser(id: string): Promise<User | null>;

  /**
   * 通过邮箱获取用户
   */
  getUserByEmail(email: string): Promise<User | null>;

  /**
   * 通过手机号获取用户
   */
  getUserByPhone(phoneNumber: string): Promise<User | null>;

  /**
   * 更新用户
   */
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  /**
   * 删除用户
   */
  deleteUser(id: string): Promise<void>;

  /**
   * 检查用户是否已认证
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * 发送密码重置邮件
   */
  sendPasswordResetEmail(email: string): Promise<void>;
} 