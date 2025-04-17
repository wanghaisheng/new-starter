import { User, Match, Message } from '@/core/lib/db/types/user';
import { IDataService } from '@/core/services/data/data-service';
import { NetworkService } from '@/core/services/data/network-service';
import { IUserAdapter } from './adapters/user-adapter';

export interface IUserService {
  initialize(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  saveCurrentUser(user: User): Promise<void>;
  getUsers(): Promise<User[]>;
  saveUsers(users: User[]): Promise<void>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; errors?: string[] }>;
  syncOfflineProfileUpdates(): Promise<number>;
  deleteUser(userId: string): Promise<void>;
  getUserById(userId: string): Promise<User | null>;
  getUsersByIds(userIds: string[]): Promise<User[]>;
  createMatch(userIds: string[]): Promise<Match>;
  getMatches(userId: string, options?: any): Promise<Match[]>;
  deleteMatch(matchId: string): Promise<void>;
  getRecommendedUsers(options?: any): Promise<User[]>;
  sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<Message>;
  updateUsersTags(userIds: string[], tags: string[]): Promise<void>;
  updateUsersProfile(userIds: string[], profile: any): Promise<void>;
  getUsersByTags(tags: string[]): Promise<User[]>;
  getUserProfile(userId: string): Promise<any>;
}

export class UserService implements IUserService {
  private static instance: UserService;
  private adapter: IUserAdapter;
  private initialized: boolean = false;

  constructor(adapter: IUserAdapter) {
    this.adapter = adapter;
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.adapter.getCurrentUser();
  }

  async saveCurrentUser(user: User): Promise<void> {
    return this.adapter.saveCurrentUser(user);
  }

  async getUsers(): Promise<User[]> {
    return this.adapter.getUsers();
  }

  async saveUsers(users: User[]): Promise<void> {
    return this.adapter.saveUsers(users);
  }

  async createUser(user: Partial<User>): Promise<User> {
    return this.adapter.createUser(user);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return this.adapter.updateUser(userId, updates);
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; errors?: string[] }> {
    return this.adapter.updateUserProfile(userId, updates);
  }

  async syncOfflineProfileUpdates(): Promise<number> {
    return this.adapter.syncOfflineProfileUpdates();
  }

  async deleteUser(userId: string): Promise<void> {
    return this.adapter.deleteUser(userId);
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.adapter.getUserById(userId);
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    return this.adapter.getUsersByIds(userIds);
  }

  async createMatch(userIds: string[]): Promise<Match> {
    return this.adapter.createMatch(userIds);
  }

  async getMatches(userId: string, options?: any): Promise<Match[]> {
    return this.adapter.getMatches(userId, options);
  }

  async deleteMatch(matchId: string): Promise<void> {
    return this.adapter.deleteMatch(matchId);
  }

  async getRecommendedUsers(options?: any): Promise<User[]> {
    return this.adapter.getRecommendedUsers(options);
  }

  async sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<Message> {
    return this.adapter.sendMessage(matchId, senderId, receiverId, content, type);
  }

  async markMessageAsRead(messageId: string): Promise<Message> {
    return this.adapter.markMessageAsRead(messageId);
  }

  /**
   * 扩展：批量更新用户标签
   */
  async updateUsersTags(userIds: string[], tags: string[]): Promise<void> {
    for (const userId of userIds) {
      await this.updateUserProfile(userId, { tags });
    }
  }

  /**
   * 扩展：根据报告批量更新用户画像
   */
  async updateUsersProfile(userIds: string[], profile: any): Promise<void> {
    for (const userId of userIds) {
      await this.updateUserProfile(userId, { profile });
    }
  }

  /**
   * 获取带标签筛选的用户列表
   */
  async getUsersByTags(tags: string[]): Promise<User[]> {
    const users = await this.getUsers();
    return users.filter(u => Array.isArray(u.tags) && tags.every(t => u.tags.includes(t)));
  }

  /**
   * 获取用户画像（示例：返回用户的 profile 字段）
   */
  async getUserProfile(userId: string): Promise<any> {
    const user = await this.getUserById(userId);
    return user?.profile;
  }
}
