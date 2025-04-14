import { User } from '@/core/lib/db/types/user';
import type { AuthProviderType, AuthSession, PhoneAuthCredentials } from './auth-types';
import type { AuthProvider } from './auth-types';

// 重新导出类型
export type { AuthProviderType };

/**
 * 认证提供者接口
 * 定义了所有认证提供者必须实现的方法
 */
export interface AuthProvider {
  /**
   * 初始化认证提供者
   */
  initialize(): Promise<void>;
  
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
  signInWithProvider(provider: AuthProviderType): Promise<AuthSession>;
  
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
  
  /**
   * 更新用户资料
   */
  updateUserProfile(userData: Partial<User>): Promise<User>;
}

/**
 * 认证提供者基类
 */
export abstract class BaseAuthProvider implements AuthProvider {
  abstract initialize(): Promise<void>;
  abstract getCurrentUser(): Promise<User | null>;
  abstract signInWithEmail(email: string, password: string): Promise<AuthSession>;
  abstract signInWithPhone(credentials: PhoneAuthCredentials): Promise<AuthSession>;
  abstract signInWithProvider(provider: AuthProviderType): Promise<AuthSession>;
  abstract signOut(): Promise<void>;
  abstract updateProfile(userData: Partial<User>): Promise<User>;
  abstract sendPhoneVerificationCode(phoneNumber: string): Promise<void>;
  abstract refreshToken(): Promise<string>;
  abstract resetPassword(email: string): Promise<void>;
  abstract sendEmailVerification(): Promise<void>;
  abstract verifyEmail(code: string): Promise<void>;
  abstract createUser(data: Partial<User>): Promise<User>;
  abstract getUser(id: string): Promise<User | null>;
  abstract getUserByEmail(email: string): Promise<User | null>;
  abstract getUserByPhone(phoneNumber: string): Promise<User | null>;
  abstract updateUser(id: string, updates: Partial<User>): Promise<User>;
  abstract deleteUser(id: string): Promise<void>;
} 