import { IUserService } from '../../types/user-service';
import { ServiceConfig } from '../../../types/config';
import { User } from '@/core/lib/db/types/user';
import { logger } from '@/core/lib/logger';

/**
 * Mock 用户服务
 */
export class MockUserService implements IUserService {
  private users: Map<string, User> = new Map();
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
    logger.info('Mock user service initialized');
  }

  /**
   * 释放服务资源
   */
  public async dispose(): Promise<void> {
    this.users.clear();
    this.initialized = false;
    logger.info('Mock user service disposed');
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
      phoneVerified: data.phoneVerified || false,
      photoURL: data.photoURL || '',
      birthDate: data.birthDate || new Date(),
      gender: data.gender || 'other',
      createdAt: new Date(),
      updatedAt: new Date(),
      photos: data.photos || [],
      interests: data.interests || [],
      location: data.location || {
        latitude: 0,
        longitude: 0,
        address: ''
      },
      privacySettings: data.privacySettings || {
        showEmail: false,
        showPhone: false,
        showLocation: false
      },
      notificationSettings: data.notificationSettings || {
        email: true,
        push: true,
        sms: false
      },
      preferences: data.preferences || {
        language: 'en',
        theme: 'light',
        timezone: 'UTC'
      },
      status: data.status || 'active',
      lastLoginAt: data.lastLoginAt || new Date()
    };
    this.users.set(user.id, user);
    return user;
  }
} 