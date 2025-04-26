import type { IUserRepository } from '@/core/lib/db/repositories/types/user-repository.types';
import type { IUserService } from '../types/user-service';
import type { User } from '@/core/lib/db/types/user.types';
import type { QueryResult } from '@/core/lib/db/types/database';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import { UserRepository } from '@/core/lib/db/repositories/impl/user-repository';

export class UserService implements IUserService {
  private userRepo: IUserRepository;
  private dataService: any;

  constructor() {
    this.dataService = DataServiceRegistry.get('default');
    if (!this.dataService) throw new Error('[UserService] DataServiceRegistry default 实例未注册');
    this.userRepo = new UserRepository(this.dataService);
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.userRepo.findById('current');
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.userRepo.findById(id);
  }

  async updateUserProfile(id: string, updates: Partial<User>): Promise<User> {
    const updated = await this.userRepo.update(id, updates);
    if (!updated) throw new Error('User not found');
    return updated;
  }

  async saveCurrentUser(user: User): Promise<void> {
    await this.userRepo.update(user.id, user);
  }

  async getUsers(): Promise<QueryResult<User>> {
    return await this.userRepo.findAll();
  }

  async saveUsers(users: User[]): Promise<void> {
    for (const user of users) {
      await this.userRepo.update(user.id, user);
    }
  }

  async createUser(user: Partial<User>): Promise<User> {
    const created = await this.userRepo.create(user as User);
    if (!created) throw new Error('User create failed');
    return created;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const updated = await this.userRepo.update(id, updates);
    if (!updated) throw new Error('User not found');
    return updated;
  }

  async syncOfflineProfileUpdates(): Promise<number> {
    // 如无实现可返回 0 或抛未实现异常
    return 0;
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }

  async getUsersByIds(ids: string[]): Promise<QueryResult<User>> {
    // 如果底层有批量查询接口可用，否则循环聚合
    const users: User[] = [];
    for (const id of ids) {
      const user = await this.userRepo.findById(id);
      if (user) users.push(user);
    }
    return { items: users, total: users.length };
  }

  async createMatch(ids: string[]): Promise<any> {
    throw new Error('Not implemented');
  }

  async getMatches(id: string, options?: any): Promise<any[]> {
    return [];
  }

  async deleteMatch(matchId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getRecommendedUsers(options?: any): Promise<QueryResult<User>> {
    // 假设有推荐逻辑，这里仅做示例
    const result = await this.userRepo.findAll({ recommended: true }, options);
    return result;
  }

  async sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<any> {
    throw new Error('Not implemented');
  }

  async markMessageAsRead(messageId: string): Promise<any> {
    throw new Error('Not implemented');
  }

  async getUsersByTags?(tags: string[]): Promise<QueryResult<User>> {
    // 假设有标签查询逻辑
    const result = await this.userRepo.findAll({ tags: tags as any });
    return result;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepo.findByEmail(email);
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    return await this.userRepo.findByPhone(phone);
  }
}
