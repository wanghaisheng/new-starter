import type { QueryResult } from '@/core/lib/db/types/database';
import type { User } from '@/core/lib/db/types/user.types';

/**
 * 用户适配器接口（所有实现必须实现本接口，禁止本地重复定义）
 * 2025-04 类型已聚合，所有实现请直接引用
 */
export interface IUserAdapter {
  /** 获取当前用户 */
  getCurrentUser(): Promise<User | null>;
  /** 按 ID 获取用户 */
  getUserById(id: string): Promise<User | null>;
  /** 更新用户资料（支持 tags/profile 字段） */
  updateUserProfile(id: string, updates: Partial<User>): Promise<User>;
  saveCurrentUser(user: User): Promise<void>;
  getUsers(): Promise<QueryResult<User>>;
  saveUsers(users: User[]): Promise<void>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  syncOfflineProfileUpdates(): Promise<number>;
  deleteUser(id: string): Promise<void>;
  getUsersByIds(ids: string[]): Promise<QueryResult<User>>;
  createMatch(ids: string[]): Promise<any>;
  getMatches(id: string, options?: any): Promise<any[]>;
  deleteMatch(matchId: string): Promise<void>;
  getRecommendedUsers(options?: any): Promise<QueryResult<User>>;
  sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<any>;
  markMessageAsRead(messageId: string): Promise<any>;
  getUsersByTags?(tags: string[]): Promise<QueryResult<User>>;
}

/**
 * 用户服务接口（业务聚合层，通常继承自 IUserAdapter）
 */
export interface IUserService extends IUserAdapter {
}

// Service 工厂类型定义
export type UserServiceType = 'mock' | 'remote' | 'hybrid';
export interface UserServiceOptions {
  apiBaseUrl?: string;
}
