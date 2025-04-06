import { AuthServiceFactory } from './auth/auth-service-factory';
import type { User } from '@/core/lib/db/types';
import { AuthProvider } from './auth/auth-types';

export class UserService {
  private static instance: UserService;
  private authProvider: AuthProvider;

  private constructor() {
    this.authProvider = AuthServiceFactory.getInstance().getProvider();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * 获取当前用户
   */
  public async getCurrentUser(): Promise<User | null> {
    return this.authProvider.getCurrentUser();
  }

  /**
   * 获取指定用户
   */
  public async getUser(id: string): Promise<User | null> {
    return this.authProvider.getUser(id);
  }

  /**
   * 通过邮箱获取用户
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    return this.authProvider.getUserByEmail(email);
  }

  /**
   * 通过手机号获取用户
   */
  public async getUserByPhone(phoneNumber: string): Promise<User | null> {
    return this.authProvider.getUserByPhone(phoneNumber);
  }

  /**
   * 更新用户信息
   */
  public async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.authProvider.updateUser(id, updates);
  }

  /**
   * 删除用户
   */
  public async deleteUser(id: string): Promise<void> {
    return this.authProvider.deleteUser(id);
  }
} 