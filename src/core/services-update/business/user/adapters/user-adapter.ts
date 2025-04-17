import { User, Match, Message } from '@/core/lib/db/types/user';

export interface IUserAdapter {
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
}
