import { IUserAdapter } from './user-adapter';
import { User, Match, Message } from '@/core/lib/db/types/user';

export class MockUserAdapter implements IUserAdapter {
  private users: User[] = [];
  private matches: Match[] = [];
  private messages: Message[] = [];
  private currentUser: User | null = null;

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }
  async saveCurrentUser(user: User): Promise<void> {
    this.currentUser = user;
  }
  async getUsers(): Promise<User[]> {
    return this.users;
  }
  async saveUsers(users: User[]): Promise<void> {
    this.users = users;
  }
  async createUser(user: Partial<User>): Promise<User> {
    const newUser = { ...user, id: `user_${Date.now()}` } as User;
    this.users.push(newUser);
    return newUser;
  }
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const idx = this.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    this.users[idx] = { ...this.users[idx], ...updates };
    return this.users[idx];
  }
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const idx = this.users.findIndex(u => u.id === userId);
      if (idx === -1) throw new Error('User not found');
      // 支持 tags/profile 字段
      if (updates.tags) {
        this.users[idx].tags = updates.tags;
      }
      if (updates.profile) {
        this.users[idx].profile = updates.profile;
      }
      this.users[idx] = { ...this.users[idx], ...updates };
      return { success: true };
    } catch (e) {
      return { success: false, errors: [String(e)] };
    }
  }
  async syncOfflineProfileUpdates(): Promise<number> {
    // mock: nothing to sync
    return 0;
  }
  async deleteUser(userId: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== userId);
    if (this.currentUser?.id === userId) this.currentUser = null;
  }
  async getUserById(userId: string): Promise<User | null> {
    return this.users.find(u => u.id === userId) || null;
  }
  async getUsersByIds(userIds: string[]): Promise<User[]> {
    return this.users.filter(u => userIds.includes(u.id));
  }
  async createMatch(userIds: string[]): Promise<Match> {
    const match: Match = { id: `match_${Date.now()}`, userIds, createdAt: new Date().toISOString() } as Match;
    this.matches.push(match);
    return match;
  }
  async getMatches(userId: string, options?: any): Promise<Match[]> {
    return this.matches.filter(m => m.userIds.includes(userId));
  }
  async deleteMatch(matchId: string): Promise<void> {
    this.matches = this.matches.filter(m => m.id !== matchId);
  }
  async getRecommendedUsers(options?: any): Promise<User[]> {
    // mock: return all users
    return this.users;
  }
  async sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<Message> {
    const msg: Message = { id: `msg_${Date.now()}`, matchId, senderId, receiverId, content, type, createdAt: new Date().toISOString() } as Message;
    this.messages.push(msg);
    return msg;
  }
  async markMessageAsRead(messageId: string): Promise<Message> {
    const idx = this.messages.findIndex(m => m.id === messageId);
    if (idx === -1) throw new Error('Message not found');
    this.messages[idx] = { ...this.messages[idx], read: true };
    return this.messages[idx];
  }
  async getUsersByTags(tags: string[]): Promise<User[]> {
    return this.users.filter(u => Array.isArray(u.tags) && tags.every(t => u.tags?.includes(t)));
  }
}
