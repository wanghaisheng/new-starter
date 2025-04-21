import type { IUserAdapter } from '@/core/services/business/user/types/user-service';
import type { User } from '@/core/lib/db/types/user';
import type { Match } from '@/core/lib/db/types/match';
import type { Message } from '@/core/lib/db/types/message';
import { MockUserAdapter } from './mock-user-adapter';
import { RemoteUserAdapter } from './remote-user-adapter';

export class HybridUserAdapter implements IUserAdapter {
  private mock: MockUserAdapter;
  private remote: RemoteUserAdapter;
  constructor(apiBaseUrl: string) {
    this.mock = new MockUserAdapter();
    this.remote = new RemoteUserAdapter(apiBaseUrl);
  }
  async getCurrentUser(): Promise<User | null> { return this.remote.getCurrentUser(); }
  async getUserById(userId: string): Promise<User | null> { return this.remote.getUserById(userId); }
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> { return this.remote.updateUserProfile(userId, updates); }
  async saveCurrentUser(user: User): Promise<void> { return this.remote.saveCurrentUser(user); }
  async getUsers(): Promise<User[]> { return this.remote.getUsers(); }
  async saveUsers(users: User[]): Promise<void> { return this.remote.saveUsers(users); }
  async createUser(user: Partial<User>): Promise<User> { return this.remote.createUser(user); }
  async updateUser(userId: string, updates: Partial<User>): Promise<User> { return this.remote.updateUser(userId, updates); }
  async syncOfflineProfileUpdates(): Promise<number> { return this.mock.syncOfflineProfileUpdates(); }
  async deleteUser(userId: string): Promise<void> { return this.remote.deleteUser(userId); }
  async getUsersByIds(userIds: string[]): Promise<User[]> { return this.remote.getUsersByIds(userIds); }
  async createMatch(userIds: string[]): Promise<Match> { return this.remote.createMatch(userIds); }
  async getMatches(userId: string, options?: any): Promise<Match[]> { return this.remote.getMatches(userId, options); }
  async deleteMatch(matchId: string): Promise<void> { return this.remote.deleteMatch(matchId); }
  async getRecommendedUsers(options?: any): Promise<User[]> { return this.remote.getRecommendedUsers(options); }
  async sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<Message> { return this.remote.sendMessage(matchId, senderId, receiverId, content, type); }
  async markMessageAsRead(messageId: string): Promise<Message> { return this.remote.markMessageAsRead(messageId); }
  async getUsersByTags?(tags: string[]): Promise<User[]> { return this.remote.getUsersByTags ? this.remote.getUsersByTags(tags) : []; }
}
