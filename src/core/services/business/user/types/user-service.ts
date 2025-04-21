// 用户服务接口定义及适配器接口统一
import type { User } from '@/core/lib/db/types/user';

/**
 * 用户适配器接口（所有实现必须实现本接口，禁止本地重复定义）
 * 2025-04 类型已聚合，所有实现请直接引用
 */
export interface IUserAdapter {
  /** 获取当前用户 */
  getCurrentUser(): Promise<User | null>;
  /** 按 ID 获取用户 */
  getUserById(userId: string): Promise<User | null>;
  /** 更新用户资料（支持 tags/profile 字段） */
  updateUserProfile(userId: string, updates: Partial<User>): Promise<User>;
  saveCurrentUser(user: User): Promise<void>;
  getUsers(): Promise<User[]>;
  saveUsers(users: User[]): Promise<void>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  syncOfflineProfileUpdates(): Promise<number>;
  deleteUser(userId: string): Promise<void>;
  getUsersByIds(userIds: string[]): Promise<User[]>;
  createMatch(userIds: string[]): Promise<any>;
  getMatches(userId: string, options?: any): Promise<any[]>;
  deleteMatch(matchId: string): Promise<void>;
  getRecommendedUsers(options?: any): Promise<User[]>;
  sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<any>;
  markMessageAsRead(messageId: string): Promise<any>;
  getUsersByTags?(tags: string[]): Promise<User[]>;
}

/**
 * 用户服务接口（业务聚合层，通常继承自 IUserAdapter）
 */
export interface IUserService extends IUserAdapter {
}
