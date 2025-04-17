import { IUserService } from '../../types/user-service';
import { ServiceConfig } from '../../../types/config';
import { User } from '@/core/lib/db/types/user';
import { logger } from '@/core/lib/logger';
import { Database } from '@better-auth/database';

/**
 * Better 用户服务
 */
export class BetterUserService implements IUserService {
  private db: Database;
  private initialized: boolean = false;

  constructor(private config: ServiceConfig) {
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
    this.initialized = true;
    logger.info('Better user service initialized');
  }

  /**
   * 释放服务资源
   */
  public async dispose(): Promise<void> {
    this.initialized = false;
    logger.info('Better user service disposed');
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
   * 获取用户
   */
  public async getUser(id: string): Promise<User | null> {
    const result = await this.db.users.findById(id);
    return result ? this.convertBetterUser(result) : null;
  }

  /**
   * 通过邮箱获取用户
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db.users.findByEmail(email);
    return result ? this.convertBetterUser(result) : null;
  }

  /**
   * 通过手机号获取用户
   */
  public async getUserByPhone(phoneNumber: string): Promise<User | null> {
    const result = await this.db.users.findByPhone(phoneNumber);
    return result ? this.convertBetterUser(result) : null;
  }

  /**
   * 更新用户
   */
  public async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const result = await this.db.users.update(id, {
      ...updates,
      updatedAt: new Date()
    });
    return this.convertBetterUser(result);
  }

  /**
   * 删除用户
   */
  public async deleteUser(id: string): Promise<void> {
    await this.db.users.delete(id);
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
    return this.convertBetterUser(result);
  }

  /**
   * 转换 Better 用户为应用用户
   */
  private convertBetterUser(betterUser: any): User {
    return {
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
        longitude: 0
      },
      privacySettings: betterUser.privacySettings || {
        showProfile: false,
        showLocation: false
      },
      notificationSettings: betterUser.notificationSettings || {
        push: true,
        email: true
      },
      preferences: betterUser.preferences || {
        language: 'en',
        theme: 'light'
      },
      status: betterUser.status || 'active',
      matching: betterUser.matching || false,
      isVerified: betterUser.isVerified || false,
      lastActive: betterUser.lastActive || new Date(),
      isOnline: betterUser.isOnline || false
    };
  }
} 