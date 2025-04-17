import { IUserAdapter } from './user-adapter';
import { User, Match, Message } from '@/core/lib/db/types/user';

export class RemoteUserAdapter implements IUserAdapter {
  private apiBaseUrl: string;
  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }
  async getCurrentUser(): Promise<User | null> {
    const resp = await fetch(`${this.apiBaseUrl}/user/current`);
    if (!resp.ok) return null;
    return resp.json();
  }
  async saveCurrentUser(user: User): Promise<void> {
    await fetch(`${this.apiBaseUrl}/user/current`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
  }
  async getUsers(): Promise<User[]> {
    const resp = await fetch(`${this.apiBaseUrl}/user`);
    return resp.json();
  }
  async saveUsers(users: User[]): Promise<void> {
    await fetch(`${this.apiBaseUrl}/user/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });
  }
  async createUser(user: Partial<User>): Promise<User> {
    const resp = await fetch(`${this.apiBaseUrl}/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return resp.json();
  }
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const resp = await fetch(`${this.apiBaseUrl}/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return resp.json();
  }
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; errors?: string[] }> {
    const resp = await fetch(`${this.apiBaseUrl}/user/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return resp.json();
  }
  async getUsersByTags(tags: string[]): Promise<User[]> {
    const resp = await fetch(`${this.apiBaseUrl}/user/by-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags })
    });
    return resp.json();
  }
  async syncOfflineProfileUpdates(): Promise<number> {
    // 假设后端支持同步接口
    const resp = await fetch(`${this.apiBaseUrl}/user/offline-sync`, { method: 'POST' });
    return resp.json();
  }
  async deleteUser(userId: string): Promise<void> {
    await fetch(`${this.apiBaseUrl}/user/${userId}`, { method: 'DELETE' });
  }
  async getUserById(userId: string): Promise<User | null> {
    const resp = await fetch(`${this.apiBaseUrl}/user/${userId}`);
    if (!resp.ok) return null;
    return resp.json();
  }
  async getUsersByIds(userIds: string[]): Promise<User[]> {
    const resp = await fetch(`${this.apiBaseUrl}/user/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userIds)
    });
    return resp.json();
  }
  async createMatch(userIds: string[]): Promise<Match> {
    const resp = await fetch(`${this.apiBaseUrl}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userIds)
    });
    return resp.json();
  }
  async getMatches(userId: string, options?: any): Promise<Match[]> {
    const resp = await fetch(`${this.apiBaseUrl}/match/user/${userId}`);
    return resp.json();
  }
  async deleteMatch(matchId: string): Promise<void> {
    await fetch(`${this.apiBaseUrl}/match/${matchId}`, { method: 'DELETE' });
  }
  async getRecommendedUsers(options?: any): Promise<User[]> {
    const resp = await fetch(`${this.apiBaseUrl}/user/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {})
    });
    return resp.json();
  }
  async sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<Message> {
    const resp = await fetch(`${this.apiBaseUrl}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, senderId, receiverId, content, type })
    });
    return resp.json();
  }
  async markMessageAsRead(messageId: string): Promise<Message> {
    const resp = await fetch(`${this.apiBaseUrl}/message/${messageId}/read`, { method: 'POST' });
    return resp.json();
  }
}
