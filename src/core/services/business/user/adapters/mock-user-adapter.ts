import type { IUserAdapter } from '@/core/services/business/user/types/user-service';
import type { User } from '@/core/lib/db/types/user';
import type { Match } from '@/core/lib/db/types/match';
import type { Message } from '@/core/lib/db/types/message';

export class MockUserAdapter implements IUserAdapter {
  private users: User[] = [];
  private currentUser: User | null = null;

  constructor() {}

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.users.find(u => u.id === userId) || null;
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    throw new Error('not implemented');
  }

  async saveCurrentUser(user: User): Promise<void> {
    this.currentUser = user;
    if (!this.users.find(u => u.id === user.id)) this.users.push(user);
  }

  async getUsers(): Promise<User[]> {
    return this.users;
  }

  async saveUsers(users: User[]): Promise<void> {
    this.users = users;
  }

  async createUser(user: Partial<User>): Promise<User> {
    const newUser = {
      ...user,
      id: String(Date.now()),
      name: user.name || '',
      birthDate: new Date(),
      gender: 'other',
      photos: [],
      interests: [],
      location: { lat: 0, lng: 0 },
      privacySettings: {
        showProfileToEveryone: true,
        showOnlineStatus: true,
        showLastActive: true,
        showInDiscovery: true,
        showDistance: true,
        allowDataCollection: true,
        allowPersonalizedAds: true,
        showEmailToMatches: true,
        showPhoneToMatches: true,
        allowProfileSharing: true,
      },
      preferences: {
        ageRange: { min: 18, max: 99 },
        distance: 50,
        gender: ['male', 'female', 'other'],
        interests: [],
        darkMode: false,
        accentColor: '#000',
      },
      notificationSettings: {
        newMatches: true,
        matchMessages: true,
        profileViews: true,
        profileLikes: true,
        appUpdates: true,
        promotions: true,
      },
    } as User;
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    throw new Error('not implemented');
  }

  async syncOfflineProfileUpdates(): Promise<number> {
    return 0;
  }

  async deleteUser(userId: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== userId);
    if (this.currentUser?.id === userId) this.currentUser = null;
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    return this.users.filter(u => userIds.includes(u.id));
  }

  async createMatch(userIds: string[]): Promise<Match> {
    return {
      id: 'mock-match',
      users: [userIds[0], userIds[1]],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getMatches(userId: string, options?: any): Promise<Match[]> {
    return [];
  }

  async deleteMatch(matchId: string): Promise<void> {}

  async getRecommendedUsers(options?: any): Promise<User[]> {
    return this.users;
  }

  async sendMessage(
    matchId: string,
    senderId: string,
    receiverId: string,
    content: string,
    type: 'text' | 'image' = 'text',
  ): Promise<Message> {
    return {
      id: 'mock-msg',
      matchId,
      senderId,
      receiverId,
      content,
      type,
      status: 'sent',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async markMessageAsRead(messageId: string): Promise<Message> {
    return {
      id: messageId,
      matchId: '',
      senderId: '',
      receiverId: '',
      content: '',
      type: 'text',
      status: 'read',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getUsersByTags?(tags: string[]): Promise<User[]> {
    return this.users.filter(u => tags.some(tag => (u as any).tags?.includes(tag)));
  }
}
