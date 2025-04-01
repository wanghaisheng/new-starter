import { User, Match, Message } from '@/core/lib/db/types';
import { BaseEntity } from '@/core/lib/db/types/base-entity';

/**
 * 数据服务接口
 * 定义所有数据服务应实现的方法
 */
export interface IDataService {
  /**
   * 初始化数据服务
   */
  initialize(): Promise<void>;
  
  /**
   * 检查服务是否已初始化
   */
  isInitialized(): boolean;
  
  /**
   * 获取用户
   * @param userId 用户ID
   */
  getUser(userId: string): Promise<User>;
  
  /**
   * 获取所有用户
   */
  getUsers(): Promise<User[]>;
  
  /**
   * 创建用户
   * @param user 用户数据
   */
  createUser(user: User): Promise<User>;
  
  /**
   * 批量创建用户
   * @param users 用户列表
   */
  bulkCreateUsers(users: User[]): Promise<User[]>;
  
  /**
   * 更新用户
   * @param userId 用户ID
   * @param updates 更新的数据
   */
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  
  /**
   * 删除用户
   * @param userId 用户ID
   */
  deleteUser(userId: string): Promise<void>;
  
  /**
   * 获取匹配
   * @param matchId 匹配ID
   */
  getMatch(matchId: string): Promise<Match>;
  
  /**
   * 获取所有匹配
   * @param userId 可选用户ID过滤器
   */
  getMatches(userId?: string): Promise<Match[]>;
  
  /**
   * 创建匹配
   * @param match 匹配数据
   */
  createMatch(match: Match): Promise<Match>;
  
  /**
   * 批量创建匹配
   * @param matches 匹配列表
   */
  bulkCreateMatches(matches: Match[]): Promise<Match[]>;
  
  /**
   * 更新匹配
   * @param matchId 匹配ID
   * @param updates 更新的数据
   */
  updateMatch(matchId: string, updates: Partial<Match>): Promise<Match>;
  
  /**
   * 删除匹配
   * @param matchId 匹配ID
   */
  deleteMatch(matchId: string): Promise<void>;
  
  /**
   * 获取消息
   * @param messageId 消息ID
   */
  getMessage(messageId: string): Promise<Message>;
  
  /**
   * 获取所有消息
   * @param matchId 可选匹配ID过滤器
   */
  getMessages(matchId?: string): Promise<Message[]>;
  
  /**
   * 获取未读消息
   * @param userId 用户ID
   */
  getUnreadMessages(userId: string): Promise<Message[]>;
  
  /**
   * 创建消息
   * @param message 消息数据
   */
  createMessage(message: Message): Promise<Message>;
  
  /**
   * 批量创建消息
   * @param messages 消息列表
   */
  bulkCreateMessages(messages: Message[]): Promise<Message[]>;
  
  /**
   * 更新消息
   * @param messageId 消息ID
   * @param updates 更新的数据
   */
  updateMessage(messageId: string, updates: Partial<Message>): Promise<Message>;
  
  /**
   * 删除消息
   * @param messageId 消息ID
   */
  deleteMessage(messageId: string): Promise<void>;
  
  /**
   * 获取通用数据
   * @param tableName 表名
   * @param id 数据ID
   */
  get<T extends BaseEntity>(tableName: string, id: string): Promise<T>;
  
  /**
   * 获取表的所有数据
   * @param tableName 表名
   */
  getAll<T extends BaseEntity>(tableName: string): Promise<T[]>;
  
  /**
   * 创建通用数据
   * @param tableName 表名
   * @param data 数据
   */
  create<T extends BaseEntity>(tableName: string, data: T): Promise<T>;
  
  /**
   * 更新通用数据
   * @param tableName 表名
   * @param id 数据ID
   * @param updates 更新的数据
   */
  update<T extends BaseEntity>(tableName: string, id: string, updates: Partial<T>): Promise<T>;
  
  /**
   * 删除通用数据
   * @param tableName 表名
   * @param id 数据ID
   */
  delete(tableName: string, id: string): Promise<void>;
  
  /**
   * 检查表是否为离线表
   * @param tableName 表名
   */
  isOfflineOnlyTable(tableName: string): Promise<boolean>;
} 