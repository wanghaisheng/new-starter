import { IUserService } from '../types/user-service';
import { IDataService } from '@/core/services-update/data/types';
import { User } from '@/core/lib/db/models';

export class MockUserServiceAdapter implements IUserService {
  private currentUser: User | null = null;
  private offlineProfileUpdates: { userId: string; data: Partial<User>; timestamp: Date }[] = [];

  constructor(private dataService: IDataService) {}

  async getConfig(): Promise<any> {
    return {};
  }

  async saveUser(user: User): Promise<void> {
    if (user.id) {
      await this.dataService.update('users', user.id, user);
    } else {
      await this.dataService.insert('users', user);
    }
  }

  async getUser(id: string): Promise<User | null> {
    const result = await this.dataService.findOne<User>('users', { id });
    return result ? new User(result) : null;
  }

  async getUsers(): Promise<User[]> {
    const users = await this.dataService.query<User>('users', {});
    return users.map(user => new User(user));
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.dataService.findOne<User>('users', { email });
    return result ? new User(result) : null;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    const result = await this.dataService.findOne<User>('users', { phoneNumber });
    return result ? new User(result) : null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error('User not found');
    const updated = { ...user, ...updates };
    await this.dataService.update('users', id, updated);
    return new User(updated);
  }

  async deleteUser(id: string): Promise<void> {
    await this.dataService.delete('users', id);
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = new User({ ...data, id: Date.now().toString() });
    await this.dataService.insert('users', user);
    return user;
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async saveCurrentUser(user: User): Promise<void> {
    this.currentUser = user;
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    const allUsers = await this.getUsers();
    return allUsers.filter(u => userIds.includes(u.id));
  }

  async saveUsers(users: User[]): Promise<void> {
    // mock: do nothing
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; errors?: string[] }> {
    try {
      await this.updateUser(userId, updates);
      return { success: true };
    } catch (e) {
      return { success: false, errors: [String(e)] };
    }
  }

  async syncOfflineProfileUpdates(): Promise<number> {
    // mock: just clear and return count
    const count = this.offlineProfileUpdates.length;
    this.offlineProfileUpdates = [];
    return count;
  }

  async getRecommendedUsers(options?: any): Promise<User[]> {
    // mock: return first N users
    const allUsers = await this.getUsers();
    if (options && options.limit) {
      return allUsers.slice(0, options.limit);
    }
    return allUsers;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.getUser(userId);
  }

  async createMatch(userIds: string[]): Promise<any> {
    // mock: create a match object
    return {
      id: Date.now().toString(),
      users: userIds,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async deleteMatch(matchId: string): Promise<void> {
    // mock: do nothing
  }

  async sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<any> {
    // mock: return a message object
    return {
      id: Date.now().toString(),
      matchId,
      senderId,
      receiverId,
      content,
      type: type || 'text',
      status: 'sent',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async markMessageAsRead(messageId: string): Promise<any> {
    // mock: return a message with updated status
    return {
      id: messageId,
      status: 'read',
      updatedAt: new Date()
    };
  }

  async getMatches(userId: string, options?: any): Promise<any[]> {
    // mock: return empty array
    return [];
  }
}
