import { IAuthService } from '../../types/auth-service';
import { ServiceConfig } from '../../../types/config';
import { User } from '@/core/lib/db/types/user';
import { AuthSession, PhoneAuthCredentials } from '../../types/auth-service';
import { logger } from '@/core/lib/logger';
import { createAuthClient } from '@better-auth/client';
import { Database } from '@better-auth/database';

/**
 * Better 认证服务
 */
export class BetterAuthService implements IAuthService {
  private client: any;
  private db: Database;
  private currentUser: User | null = null;
  private initialized: boolean = false;

  constructor(private config: ServiceConfig) {
    this.client = createAuthClient({
      secret: config.config?.secret,
      databaseUrl: config.config?.databaseUrl,
      authToken: config.config?.authToken
    });
    this.db = new Database({
      url: config.config?.databaseUrl,
      authToken: config.config?.authToken
    });
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 监听认证状态变化
    this.client.onAuthStateChanged(async (user: any) => {
      if (user) {
        this.currentUser = await this.convertBetterUser(user);
      } else {
        this.currentUser = null;
      }
    });

    this.initialized = true;
    logger.info('Better auth service initialized');
  }

  /**
   * 释放服务资源
   */
  public async dispose(): Promise<void> {
    this.currentUser = null;
    this.initialized = false;
    logger.info('Better auth service disposed');
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
    const result = await this.client.signInWithEmailAndPassword(email, password);
    const user = await this.convertBetterUser(result.user);
    const token = result.token;
    return {
      user,
      token,
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  /**
   * 使用手机号和验证码登录
   */
  public async signInWithPhone(credentials: PhoneAuthCredentials): Promise<AuthSession> {
    const result = await this.client.signInWithPhoneNumber(
      credentials.phoneNumber,
      credentials.verificationCode
    );
    const user = await this.convertBetterUser(result.user);
    const token = result.token;
    return {
      user,
      token,
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  /**
   * 使用第三方提供者登录
   */
  public async signInWithProvider(provider: string): Promise<AuthSession> {
    const result = await this.client.signInWithProvider(provider);
    const user = await this.convertBetterUser(result.user);
    const token = result.token;
    return {
      user,
      token,
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  /**
   * 使用邮箱和密码注册
   */
  public async signUpWithEmail(email: string, password: string, name: string): Promise<User> {
    const result = await this.client.signUpWithEmailAndPassword(email, password, { name });
    return this.convertBetterUser(result.user);
  }

  /**
   * 登出当前用户
   */
  public async signOut(): Promise<void> {
    await this.client.signOut();
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
    await this.client.sendPhoneVerificationCode(phoneNumber);
  }

  /**
   * 刷新认证令牌
   */
  public async refreshToken(): Promise<string> {
    return this.client.refreshToken();
  }

  /**
   * 重置密码
   */
  public async resetPassword(email: string): Promise<void> {
    await this.client.sendPasswordResetEmail(email);
  }

  /**
   * 发送邮箱验证
   */
  public async sendEmailVerification(): Promise<void> {
    await this.client.sendEmailVerification();
  }

  /**
   * 验证邮箱
   */
  public async verifyEmail(code: string): Promise<void> {
    await this.client.verifyEmail(code);
  }

  /**
   * 创建用户
   */
  public async createUser(data: Partial<User>): Promise<User> {
    const result = await this.db.users.create({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return result as User;
  }

  /**
   * 获取用户
   */
  public async getUser(id: string): Promise<User | null> {
    const result = await this.db.users.findById(id);
    return result as User | null;
  }

  /**
   * 通过邮箱获取用户
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.users.findByEmail(email);
    return result as User | null;
  }

  /**
   * 通过手机号获取用户
   */
  public async getUserByPhone(phoneNumber: string): Promise<User | null> {
    const result = await this.db.users.findByPhone(phoneNumber);
    return result as User | null;
  }

  /**
   * 更新用户
   */
  public async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const result = await this.db.users.update(id, {
      ...updates,
      updatedAt: new Date()
    });
    return result as User;
  }

  /**
   * 删除用户
   */
  public async deleteUser(id: string): Promise<void> {
    await this.db.users.delete(id);
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
    await this.client.sendPasswordResetEmail(email);
  }

  /**
   * 转换 Better 用户为应用用户
   */
  private async convertBetterUser(betterUser: any): Promise<User> {
    const user: User = {
      id: betterUser.id,
      email: betterUser.email,
      name: betterUser.name,
      phoneNumber: betterUser.phoneNumber,
      emailVerified: betterUser.emailVerified,
      phoneVerified: betterUser.phoneVerified,
      photoURL: betterUser.photoURL,
      birthDate: betterUser.birthDate || new Date(),
      gender: betterUser.gender || 'other',
      createdAt: betterUser.createdAt || new Date(),
      updatedAt: betterUser.updatedAt || new Date(),
      photos: betterUser.photos || [],
      interests: betterUser.interests || [],
      location: betterUser.location || {
        latitude: 0,
        longitude: 0,
        address: ''
      },
      privacySettings: betterUser.privacySettings || {
        showEmail: false,
        showPhone: false,
        showLocation: false
      },
      notificationSettings: betterUser.notificationSettings || {
        email: true,
        push: true,
        sms: false
      },
      preferences: betterUser.preferences || {
        language: 'en',
        theme: 'light',
        timezone: 'UTC'
      },
      status: betterUser.status || 'active',
      role: betterUser.role || 'user',
      lastLoginAt: betterUser.lastLoginAt || new Date()
    };

    return user;
  }
}