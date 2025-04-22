import type { IUserAdapter, IUserService, UserServiceType, UserServiceOptions } from '@/core/services/business/user/types/user-service';
import { UserServiceFactory } from '../factory/user-service-factory';

export class UserService implements IUserService {
  private adapter: IUserAdapter;

  constructor(type: UserServiceType = 'mock', options: UserServiceOptions = {}) {
    this.adapter = UserServiceFactory.getAdapter(type, options) ?? UserServiceFactory.getAdapter('mock')!;
  }

  async getCurrentUser(): Promise<any> {
    return this.adapter.getCurrentUser();
  }

  async getUserById(userId: string): Promise<any> {
    return this.adapter.getUserById(userId);
  }

  async updateUserProfile(userId: string, updates: any): Promise<any> {
    return this.adapter.updateUserProfile(userId, updates);
  }

  async saveCurrentUser(user: any): Promise<void> {
    return this.adapter.saveCurrentUser(user);
  }

  async getUsers(): Promise<any[]> {
    return this.adapter.getUsers();
  }

  async saveUsers(users: any[]): Promise<void> {
    return this.adapter.saveUsers(users);
  }

  async createUser(user: any): Promise<any> {
    return this.adapter.createUser(user);
  }

  async updateUser(userId: string, updates: any): Promise<any> {
    return this.adapter.updateUser(userId, updates);
  }

  async syncOfflineProfileUpdates(): Promise<number> {
    return this.adapter.syncOfflineProfileUpdates();
  }

  async deleteUser(userId: string): Promise<void> {
    return this.adapter.deleteUser(userId);
  }

  async getUsersByIds(userIds: string[]): Promise<any[]> {
    return this.adapter.getUsersByIds(userIds);
  }

  async createMatch(userIds: string[]): Promise<any> {
    return this.adapter.createMatch(userIds);
  }

  async getMatches(userId: string, options?: any): Promise<any[]> {
    return this.adapter.getMatches(userId, options);
  }

  async deleteMatch(matchId: string): Promise<void> {
    return this.adapter.deleteMatch(matchId);
  }

  async getRecommendedUsers(options?: any): Promise<any[]> {
    return this.adapter.getRecommendedUsers(options);
  }

  async sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<any> {
    return this.adapter.sendMessage(matchId, senderId, receiverId, content, type);
  }

  async markMessageAsRead(messageId: string): Promise<any> {
    return this.adapter.markMessageAsRead(messageId);
  }

  async getUsersByTags?(tags: string[]): Promise<any[]> {
    return this.adapter.getUsersByTags ? this.adapter.getUsersByTags(tags) : [];
  }
}
