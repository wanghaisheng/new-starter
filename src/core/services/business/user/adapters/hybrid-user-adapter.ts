import type { IUserAdapter } from '@/core/services/business/user/types/user-service';
import type { User } from '@/core/lib/db/types/user';
import type { Match } from '@/core/lib/db/types/match';
import type { Message } from '@/core/lib/db/types/message';
import { MockUserAdapter } from './mock-user-adapter';
import { RemoteUserAdapter } from './remote-user-adapter';
import { repositoryRegistry } from '@/core/lib/db/repositories/registry/repository-registry';
import type { IUserRepository } from '@/core/lib/db/repositories/types/user-repository';

export class HybridUserAdapter implements IUserAdapter {
  private mock: MockUserAdapter;
  private remote: RemoteUserAdapter;
  private userRepository: IUserRepository;
  constructor(apiBaseUrl: string) {
    this.mock = new MockUserAdapter();
    this.remote = new RemoteUserAdapter(apiBaseUrl);
    this.userRepository = repositoryRegistry.get('user'); // 统一通过注册表获取 user 仓储
  }
  async getCurrentUser(): Promise<User | null> {
    return this.userRepository.findById('current'); // 假设 current user 以特殊 id 标识，或后续扩展仓储接口
  }
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    return this.userRepository.update(userId, updates);
  }
  async saveCurrentUser(user: User): Promise<void> {
    // 若仓储未实现该方法，可补充扩展
    await this.remote.saveCurrentUser(user);
  }
  async getUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }
  async saveUsers(users: User[]): Promise<void> {
    await this.remote.saveUsers(users);
  }
  async createUser(user: Partial<User>): Promise<User> {
    return this.userRepository.create(user as User);
  }
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return this.userRepository.update(userId, updates);
  }
  async syncOfflineProfileUpdates(): Promise<number> {
    return this.mock.syncOfflineProfileUpdates();
  }
  async deleteUser(userId: string): Promise<void> {
    await this.userRepository.delete(userId);
  }
  async getUsersByIds(userIds: string[]): Promise<User[]> {
    // 仓储未定义批量查找接口时走 remote
    return this.remote.getUsersByIds(userIds);
  }
  async createMatch(userIds: string[]): Promise<Match> {
    return this.remote.createMatch(userIds);
  }
  async getMatches(userId: string, options?: any): Promise<Match[]> {
    return this.remote.getMatches(userId, options);
  }
  async deleteMatch(matchId: string): Promise<void> {
    return this.remote.deleteMatch(matchId);
  }
  async getRecommendedUsers(options?: any): Promise<User[]> {
    return this.remote.getRecommendedUsers(options);
  }
  async sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<Message> {
    return this.remote.sendMessage(matchId, senderId, receiverId, content, type);
  }
  async markMessageAsRead(messageId: string): Promise<Message> {
    return this.remote.markMessageAsRead(messageId);
  }
  async getUsersByTags?(tags: string[]): Promise<User[]> {
    return this.remote.getUsersByTags ? this.remote.getUsersByTags(tags) : [];
  }
}
