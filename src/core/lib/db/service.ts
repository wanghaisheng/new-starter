import { DatabaseFactory } from './factory';
import { IDatabaseClient } from './interfaces';
import { User, Match, Message } from './models';
import { UserRepository } from './repositories/user-repository';
import { MatchRepository } from './repositories/match-repository';
import { MessageRepository } from './repositories/message-repository';

/**
 * 数据库服务类
 * 管理数据库客户端和仓储
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private client: IDatabaseClient;
  private isInitialized = false;
  
  // 仓储实例
  private userRepository: UserRepository;
  private matchRepository: MatchRepository;
  private messageRepository: MessageRepository;

  private constructor() {
    // 使用工厂方法根据环境变量创建客户端
    this.client = DatabaseFactory.createClientFromEnv();
    
    // 初始化仓储
    this.userRepository = new UserRepository(this.client);
    this.matchRepository = new MatchRepository(this.client);
    this.messageRepository = new MessageRepository(this.client);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await this.client.initialize();
      this.isInitialized = true;
    }
  }

  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.client.close();
      this.isInitialized = false;
    }
  }

  async clear(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('数据库服务未初始化');
    }
    await this.client.clear();
  }

  // 获取仓储实例
  getUserRepository(): UserRepository {
    this.checkInitialized();
    return this.userRepository;
  }
  
  getMatchRepository(): MatchRepository {
    this.checkInitialized();
    return this.matchRepository;
  }
  
  getMessageRepository(): MessageRepository {
    this.checkInitialized();
    return this.messageRepository;
  }

  // 向后兼容的方法 - 用户相关操作
  /**
   * @deprecated 请使用 getUserRepository().create() 或 update() 代替
   */
  async saveUser(user: User): Promise<void> {
    this.checkInitialized();
    if (user.id) {
      await this.userRepository.update(user.id, user);
    } else {
      await this.userRepository.create(user);
    }
  }

  async getUser(id: string): Promise<User | null> {
    this.checkInitialized();
    const result = await this.userRepository.findById(id);
    return result ? new User(result) : null;
  }

  async getUsers(): Promise<User[]> {
    this.checkInitialized();
    const users = await this.userRepository.findAll();
    return users.map(user => new User(user));
  }

  async updateUser(user: User): Promise<void> {
    this.checkInitialized();
    await this.userRepository.update(user.id, user);
  }

  async deleteUser(id: string): Promise<void> {
    this.checkInitialized();
    await this.userRepository.delete(id);
  }

  // 向后兼容的方法 - 匹配相关操作
  async saveMatch(match: Match): Promise<void> {
    this.checkInitialized();
    if (match.id) {
      await this.matchRepository.update(match.id, match);
    } else {
      await this.matchRepository.create(match);
    }
  }

  async getMatch(id: string): Promise<Match | null> {
    this.checkInitialized();
    const result = await this.matchRepository.findById(id);
    return result ? new Match(result) : null;
  }

  async getMatches(): Promise<Match[]> {
    this.checkInitialized();
    const matches = await this.matchRepository.findAll();
    return matches.map(match => new Match(match));
  }

  async getMatchesByUserId(userId: string): Promise<Match[]> {
    this.checkInitialized();
    const matches = await this.matchRepository.findByUserId(userId);
    return matches.map(match => new Match(match));
  }

  async deleteMatch(id: string): Promise<void> {
    this.checkInitialized();
    await this.matchRepository.delete(id);
  }

  // 向后兼容的方法 - 消息相关操作
  async saveMessage(message: Message): Promise<void> {
    this.checkInitialized();
    if (message.id) {
      await this.messageRepository.update(message.id, message);
    } else {
      await this.messageRepository.create(message);
    }
  }

  async getMessage(id: string): Promise<Message | null> {
    this.checkInitialized();
    const result = await this.messageRepository.findById(id);
    return result ? new Message(result) : null;
  }

  async getMessages(matchId: string): Promise<Message[]> {
    this.checkInitialized();
    const messages = await this.messageRepository.findByMatchId(matchId);
    return messages.map(message => new Message(message));
  }

  async deleteMessage(id: string): Promise<void> {
    this.checkInitialized();
    await this.messageRepository.delete(id);
  }

  // 通用查询接口 - 向后兼容
  async query<T>(tableName: string, options: any): Promise<T[]> {
    this.checkInitialized();
    const results = await this.client.query(tableName, options);
    return results as unknown as T[];
  }

  async findOne<T>(tableName: string, filter: any): Promise<T | null> {
    this.checkInitialized();
    const results = await this.client.query(tableName, {
      where: filter,
      limit: 1
    });
    
    return (results as any)?.length > 0 ? (results as any)[0] as T : null;
  }

  async insert<T extends { id: string }>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    const result = await this.client.create(tableName, data as any);
    return result as unknown as T;
  }

  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    await this.client.update(tableName, id, data as any);
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    await this.client.delete(tableName, id);
  }

  // 获取原始数据库客户端实例
  getRawClient(): IDatabaseClient {
    this.checkInitialized();
    return this.client;
  }
  
  // 辅助方法
  private checkInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('数据库服务未初始化');
    }
  }
}