import { IService } from '../../types/base';
import { ServiceConfig } from '../../types/config';
import { User } from '@/core/lib/db/types/user';
import { Match } from '@/core/lib/db/types/match';
import { Message } from '@/core/lib/db/types/message';

/**
 * 用户服务接口（补全所有领域方法）
 */
export interface IUserService extends IService {
  /**
   * 获取服务配置
   */
  getConfig(): ServiceConfig;

  /**
   * 获取用户
   */
  getUser(id: string): Promise<User | null>;

  /**
   * 获取所有用户
   */
  getUsers(): Promise<User[]>;

  /**
   * 通过邮箱获取用户
   */
  getUserByEmail(email: string): Promise<User | null>;

  /**
   * 通过手机号获取用户
   */
  getUserByPhone(phoneNumber: string): Promise<User | null>;

  /**
   * 更新用户
   */
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  /**
   * 删除用户
   */
  deleteUser(id: string): Promise<void>;

  /**
   * 创建用户
   */
  createUser(data: Partial<User>): Promise<User>;

  /**
   * 获取当前用户
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * 保存当前用户
   */
  saveCurrentUser(user: User): Promise<void>;

  /**
   * 通过用户ID列表获取用户
   */
  getUsersByIds(userIds: string[]): Promise<User[]>;

  /**
   * 保存用户列表
   */
  saveUsers(users: User[]): Promise<void>;

  /**
   * 更新用户个人资料
   */
  updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; errors?: string[] }>;

  /**
   * 同步离线个人资料更新
   */
  syncOfflineProfileUpdates(): Promise<number>;

  /**
   * 获取推荐用户
   */
  getRecommendedUsers(options?: any): Promise<User[]>;

  /**
   * 根据ID获取用户
   */
  getUserById(userId: string): Promise<User | null>;

  /**
   * 创建匹配
   */
  createMatch(userIds: string[]): Promise<Match>;

  /**
   * 删除匹配
   */
  deleteMatch(matchId: string): Promise<void>;

  /**
   * 发送消息
   */
  sendMessage(matchId: string, senderId: string, receiverId: string, content: string, type?: string): Promise<Message>;

  /**
   * 标记消息为已读
   */
  markMessageAsRead(messageId: string): Promise<Message>;

  /**
   * 获取用户的匹配列表
   */
  getMatches(userId: string, options?: any): Promise<Match[]>;
}