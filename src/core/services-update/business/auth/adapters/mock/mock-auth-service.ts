import { IAuthService } from '../../types/auth-service';
import { ServiceConfig } from '../../../types/config';
import { User } from '@/core/lib/db/types/user';
import { AuthSession, PhoneAuthCredentials } from '../../types/auth-service';
import { logger } from '@/core/lib/logger';

/**
 * Mock 认证服务
 */
export class MockAuthService implements IAuthService {
  private users: Map<string, User> = new Map();
  private currentUser: User | null = null;
  private initialized: boolean = false;

  constructor(private config: ServiceConfig) {}

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    logger.info('Mock auth service initialized');
  }

  /**
   * 释放服务资源
   */
  public async dispose(): Promise<void> {
    this.users.clear();
    this.currentUser = null;
    this.initialized = false;
    logger.info('Mock auth service disposed');
  }

  /**
   * 检查服务是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取服务配置
   */
  public getConfig(): ServiceConfig {
    return this.config;
  }

  /**
   * 获取当前认证用户
   */
  public async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  /**
   * 使用邮箱和密码登录
   */
  public async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }
    this.currentUser = user;
    return {
      user,
      token: 'mock-token',
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  /**
   * 使用手机号和验证码登录
   */
  public async signInWithPhone(credentials: PhoneAuthCredentials): Promise<AuthSession> {
    const user = Array.from(this.users.values()).find(u => u.phoneNumber === credentials.phoneNumber);
    if (!user) {
      throw new Error('User not found');
    }
    this.currentUser = user;
    return {
      user,
      token: 'mock-token',
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  /**
   * 使用第三方提供者登录
   */
  public async signInWithProvider(provider: string): Promise<AuthSession> {
    const user = this.createDemoUser(provider);
    this.currentUser = user;
    return {
      user,
      token: 'mock-token',
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  /**
   * 使用邮箱和密码注册
   */
  public async signUpWithEmail(email: string, password: string, name: string): Promise<User> {
    const user = await this.createUser({
      email,
      name,
      password
    });
    this.currentUser = user;
    return user;
  }

  /**
   * 登出当前用户
   */
  public async signOut(): Promise<void> {
    this.currentUser = null;
  }

  /**
   * 更新用户资料
   */
  public async updateProfile(userData: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }
    return this.updateUser(this.currentUser.id, userData);
  }

  /**
   * 发送手机验证码
   */
  public async sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
    logger.info(`Verification code sent to ${phoneNumber}`);
  }

  /**
   * 刷新认证令牌
   */
  public async refreshToken(): Promise<string> {
    return 'mock-refreshed-token';
  }

  /**
   * 重置密码
   */
  public async resetPassword(email: string): Promise<void> {
    logger.info(`Password reset email sent to ${email}`);
  }

  /**
   * 发送邮箱验证
   */
  public async sendEmailVerification(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }
    logger.info(`Verification email sent to ${this.currentUser.email}`);
  }

  /**
   * 验证邮箱
   */
  public async verifyEmail(code: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }
    this.currentUser.emailVerified = true;
    await this.updateUser(this.currentUser.id, { emailVerified: true });
  }

  /**
   * 创建用户
   */
  public async createUser(data: Partial<User>): Promise<User> {
    const user: User = {
      id: `user-${Date.now()}`,
      email: data.email || '',
      name: data.name || '',
      phoneNumber: data.phoneNumber || '',
      emailVerified: data.emailVerified || false,
      phoneNumberVerified: data.phoneNumberVerified || false,
      photoURL: data.photoURL || '',
      birthDate: data.birthDate || new Date(),
      gender: data.gender || 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      ...data
    };
    this.users.set(user.id, user);
    return user;
  }

  /**
   * 获取用户
   */
  public async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  /**
   * 通过邮箱获取用户
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  /**
   * 通过手机号获取用户
   */
  public async getUserByPhone(phoneNumber: string): Promise<User | null> {
    return Array.from(this.users.values()).find(u => u.phoneNumber === phoneNumber) || null;
  }

  /**
   * 更新用户
   */
  public async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    if (this.currentUser?.id === id) {
      this.currentUser = updatedUser;
    }
    return updatedUser;
  }

  /**
   * 删除用户
   */
  public async deleteUser(id: string): Promise<void> {
    if (!this.users.has(id)) {
      throw new Error('User not found');
    }
    this.users.delete(id);
    if (this.currentUser?.id === id) {
      this.currentUser = null;
    }
  }

  /**
   * 检查用户是否已认证
   */
  public async isAuthenticated(): Promise<boolean> {
    return !!this.currentUser;
  }

  /**
   * 发送密码重置邮件
   */
  public async sendPasswordResetEmail(email: string): Promise<void> {
    logger.info(`Password reset email sent to ${email}`);
  }

  /**
   * 创建演示用户
   */
  private createDemoUser(provider: string): User {
    const user: User = {
      id: `demo-${Date.now()}`,
      email: `demo@${provider}.com`,
      name: `Demo ${provider} User`,
      phoneNumber: '',
      emailVerified: true,
      phoneNumberVerified: false,
      photoURL: '',
      birthDate: new Date(),
      gender: 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }
} 