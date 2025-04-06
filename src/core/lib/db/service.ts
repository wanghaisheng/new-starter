import { DatabaseFactory } from '@/core/lib/db/factory';
import { IDatabaseClient } from '@/core/lib/db/interfaces';
import { User, Match, Message } from '@/core/lib/db/models';
import { UserRepository } from '@/core/lib/db/repositories/user-repository';
import { MatchRepository } from '@/core/lib/db/repositories/match-repository';
import { MessageRepository } from '@/core/lib/db/repositories/message-repository';
import { initializeSchemas } from '@/core/lib/db/schema/index';

/**
 * 数据库服务类
 * 管理数据库客户端和仓储
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private client: IDatabaseClient;
  private isInitialized = false;
  
  // 仓储实例
  private userRepository: UserRepository | null = null;
  private matchRepository: MatchRepository | null = null;
  private messageRepository: MessageRepository | null = null;

  private constructor() {
    // 使用工厂方法根据环境变量创建客户端
    this.client = DatabaseFactory.createClientFromEnv();
    
    // 不要在构造函数中初始化仓储
    // 推迟到 initialize 方法中或首次使用时
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      try {
        // 初始化所有模式
        console.log('初始化数据库模式...');
        initializeSchemas();
        console.log('数据库模式初始化完成');
        
        // 初始化数据库客户端
        console.log('初始化数据库客户端...');
        await this.client.initialize();
        console.log('数据库客户端初始化完成');
        
        // 初始化仓储
        this.userRepository = new UserRepository(this.client);
        this.matchRepository = new MatchRepository(this.client);
        this.messageRepository = new MessageRepository(this.client);
        
        this.isInitialized = true;
      } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
      }
    }
  }

  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.client.close();
      this.isInitialized = false;
      // 重置仓储
      this.userRepository = null;
      this.matchRepository = null;
      this.messageRepository = null;
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
    if (!this.userRepository) {
      this.userRepository = new UserRepository(this.client);
    }
    return this.userRepository;
  }
  
  getMatchRepository(): MatchRepository {
    this.checkInitialized();
    if (!this.matchRepository) {
      this.matchRepository = new MatchRepository(this.client);
    }
    return this.matchRepository;
  }
  
  getMessageRepository(): MessageRepository {
    this.checkInitialized();
    if (!this.messageRepository) {
      this.messageRepository = new MessageRepository(this.client);
    }
    return this.messageRepository;
  }

  // 向后兼容的方法 - 用户相关操作
  /**
   * @deprecated 请使用 getUserRepository().create() 或 update() 代替
   */
  async saveUser(user: User): Promise<void> {
    this.checkInitialized();
    if (user.id) {
      await this.getUserRepository().update(user.id, user);
    } else {
      await this.getUserRepository().create(user);
    }
  }

  async getUser(id: string): Promise<User | null> {
    this.checkInitialized();
    const result = await this.getUserRepository().findById(id);
    return result ? new User(result) : null;
  }

  async getUsers(): Promise<User[]> {
    this.checkInitialized();
    const users = await this.getUserRepository().findAll();
    return users.map(user => new User(user));
  }

  async updateUser(user: User): Promise<void> {
    this.checkInitialized();
    await this.getUserRepository().update(user.id, user);
  }

  async deleteUser(id: string): Promise<void> {
    this.checkInitialized();
    await this.getUserRepository().delete(id);
  }

  // 向后兼容的方法 - 匹配相关操作
  async saveMatch(match: Match): Promise<void> {
    this.checkInitialized();
    if (match.id) {
      await this.getMatchRepository().update(match.id, match);
    } else {
      await this.getMatchRepository().create(match);
    }
  }

  async getMatch(id: string): Promise<Match | null> {
    this.checkInitialized();
    const result = await this.getMatchRepository().findById(id);
    return result ? new Match(result) : null;
  }

  async getMatches(): Promise<Match[]> {
    this.checkInitialized();
    const matches = await this.getMatchRepository().findAll();
    return matches.map(match => new Match(match));
  }

  async getMatchesByUserId(userId: string): Promise<Match[]> {
    this.checkInitialized();
    const matches = await this.getMatchRepository().findByUserId(userId);
    return matches.map(match => new Match(match));
  }

  async deleteMatch(id: string): Promise<void> {
    this.checkInitialized();
    await this.getMatchRepository().delete(id);
  }

  // 向后兼容的方法 - 消息相关操作
  async saveMessage(message: Message): Promise<void> {
    this.checkInitialized();
    if (message.id) {
      await this.getMessageRepository().update(message.id, message);
    } else {
      await this.getMessageRepository().create(message);
    }
  }

  async getMessage(id: string): Promise<Message | null> {
    this.checkInitialized();
    const result = await this.getMessageRepository().findById(id);
    return result ? new Message(result) : null;
  }

  async getMessages(matchId: string): Promise<Message[]> {
    this.checkInitialized();
    const messages = await this.getMessageRepository().findByMatchId(matchId);
    return messages.map(message => new Message(message));
  }

  async deleteMessage(id: string): Promise<void> {
    this.checkInitialized();
    await this.getMessageRepository().delete(id);
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