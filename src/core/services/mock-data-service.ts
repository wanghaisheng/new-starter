import { User, Match, Message } from '@/core/lib/db/types';
import { IDataService } from './data-service-interface';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { DatabaseFactory, DatabaseClientType } from '@/core/lib/db/factory';
import { DatabaseService as CoreDatabaseService } from '@/core/lib/db/service';
import { NetworkService } from './network-service';
import { SyncManager } from '@/core/lib/db/sync/sync-manager';
import { DatabaseConfig } from '@/core/lib/db/interfaces';

/**
 * Mock数据服务
 * 复用核心库中的MockDatabaseClient，避免重复实现
 */
export class MockDataService implements IDataService {
  private static instance: MockDataService;
  private coreService: CoreDatabaseService;
  private networkService: NetworkService;
  private syncManager: SyncManager | null = null;
  private _isInitialized = false;

  private constructor() {
    // 使用工厂创建Mock客户端
    const mockConfig: DatabaseConfig = {
      name: 'mock-database',
      version: 1,
      engine: DatabaseClientType.MOCK
    };

    // 初始化核心数据库服务（通过单例模式获取）
    this.coreService = CoreDatabaseService.getInstance();
    
    // 获取网络服务实例
    this.networkService = NetworkService.getInstance();
  }

  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  /**
   * 初始化数据服务
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) return;
    
    try {
      // 初始化核心数据库服务
      await this.coreService.initialize();
      
      // 初始化一些测试数据（如果需要）
      await this.initializeMockData();
      
      // 初始化同步管理器（如果测试需要）
      this.syncManager = new SyncManager({
        client: this.coreService as any, // Type casting to avoid interface mismatch
        networkManager: this.networkService as any,
        entityTypes: ['users', 'matches', 'messages'],
        autoSyncOnConnect: false, // 避免自动同步
        syncIntervalMs: 0 // 禁用自动同步
      });
      
      this._isInitialized = true;
      console.log('MockDataService initialized');
    } catch (error) {
      console.error('Error initializing MockDataService:', error);
      throw error;
    }
  }

  /**
   * 初始化测试数据
   */
  private async initializeMockData(): Promise<void> {
    try {
      // 检查是否已有数据
      const existingUsers = await this.coreService.query<User>('users', {});
      if (existingUsers && existingUsers.length > 0) {
        return; // 已有数据，不重复添加
      }

      // 创建测试用户
      const users: User[] = [
        {
          id: '1',
          name: '张三',
          email: 'zhangsan@example.com',
          bio: '喜欢旅行和摄影',
          photos: [
            {
              id: '11',
              url: 'https://picsum.photos/400/600?random=1',
              order: 0,
              isMain: true,
              userId: '1',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          interests: ['旅行', '摄影', '美食'],
          birthDate: new Date('1998-01-01'),
          gender: 'male',
          location: {
            latitude: 39.9042,
            longitude: 116.4074,
            city: '北京',
            country: '中国'
          },
          preferences: {
            ageRange: { min: 20, max: 35 },
            distance: 50,
            gender: ['female'],
            interests: ['旅行', '美食', '电影']
          },
          isVerified: true,
          lastActive: new Date(),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: '李四',
          email: 'lisi@example.com',
          bio: '热爱运动和音乐',
          photos: [
            {
              id: '21',
              url: 'https://picsum.photos/400/600?random=4',
              order: 0,
              isMain: true,
              userId: '2',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          interests: ['运动', '音乐', '电影'],
          birthDate: new Date('1995-06-15'),
          gender: 'female',
          location: {
            latitude: 31.2304,
            longitude: 121.4737,
            city: '上海',
            country: '中国'
          },
          preferences: {
            ageRange: { min: 25, max: 40 },
            distance: 30,
            gender: ['male'],
            interests: ['运动', '户外', '旅行']
          },
          isVerified: true,
          lastActive: new Date(),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // 创建测试匹配
      const matches: Match[] = [
        {
          id: '1',
          users: ['1', '2'],
          status: 'matched',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // 创建测试消息
      const messages: Message[] = [
        {
          id: '1',
          matchId: '1',
          senderId: '1',
          receiverId: '2',
          content: '你好！很高兴认识你！',
          type: 'text',
          status: 'sent',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          matchId: '1',
          senderId: '2',
          receiverId: '1',
          content: '你好！我也是！',
          type: 'text',
          status: 'read',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // 批量插入测试数据
      await Promise.all([
        ...users.map(user => this.coreService.insert('users', user)),
        ...matches.map(match => this.coreService.insert('matches', match)),
        ...messages.map(message => this.coreService.insert('messages', message))
      ]);

      console.log('Mock data initialized');
    } catch (error) {
      console.error('Error initializing mock data:', error);
    }
  }

  /**
   * 检查服务是否已初始化
   */
  public isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 关闭数据库连接
   */
  public async close(): Promise<void> {
    if (!this._isInitialized) return;
    
    try {
      // 清理同步管理器资源
      if (this.syncManager) {
        this.syncManager.dispose();
      }
      
      // 关闭核心数据库服务
      await this.coreService.close();
      
      this._isInitialized = false;
      console.log('MockDataService closed');
    } catch (error) {
      console.error('Error closing MockDataService:', error);
      throw error;
    }
  }

  /**
   * 清空数据库
   */
  public async clearAll(): Promise<void> {
    await this.ensureInitialized();
    await this.coreService.clear();
    await this.initializeMockData(); // 重新初始化测试数据
  }

  /**
   * 检查表是否为离线专用
   */
  public async isOfflineOnlyTable(tableName: string): Promise<boolean> {
    return ['offline_notes', 'device_settings'].includes(tableName);
  }

  /**
   * 执行同步（Mock实现，实际上不做任何事情）
   */
  public async sync(): Promise<void> {
    console.log('Mock sync called - no action taken');
  }

  // 以下所有方法都直接代理到核心服务

  /**
   * 获取用户
   */
  public async getUser(userId: string): Promise<User> {
    await this.ensureInitialized();
    const user = await this.coreService.findOne<User>('users', { id: userId });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * 获取所有用户
   */
  public async getUsers(): Promise<User[]> {
    await this.ensureInitialized();
    const result = await this.coreService.query<User>('users', {});
    return result;
  }

  /**
   * 创建用户
   */
  public async createUser(user: User): Promise<User> {
    await this.ensureInitialized();
    return this.coreService.insert<User>('users', user);
  }

  /**
   * 更新用户
   */
  public async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    await this.ensureInitialized();
    await this.coreService.update<User>('users', userId, updates);
    const updated = await this.getUser(userId);
    return updated;
  }

  /**
   * 删除用户
   */
  public async deleteUser(userId: string): Promise<void> {
    await this.ensureInitialized();
    await this.coreService.delete('users', userId);
  }

  /**
   * 获取匹配
   */
  public async getMatch(matchId: string): Promise<Match> {
    await this.ensureInitialized();
    const match = await this.coreService.findOne<Match>('matches', { id: matchId });
    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }
    return match;
  }

  /**
   * 获取匹配列表
   */
  public async getMatches(userId?: string): Promise<Match[]> {
    await this.ensureInitialized();
    
    if (userId) {
      const result = await this.coreService.query<Match>('matches', {
        where: {
          field: 'users',
          operator: 'array-contains',
          value: userId
        }
      });
      return result;
    }
    
    const result = await this.coreService.query<Match>('matches', {});
    return result;
  }

  /**
   * 创建匹配
   */
  public async createMatch(match: Match): Promise<Match> {
    await this.ensureInitialized();
    return this.coreService.insert<Match>('matches', match);
  }

  /**
   * 更新匹配
   */
  public async updateMatch(matchId: string, updates: Partial<Match>): Promise<Match> {
    await this.ensureInitialized();
    await this.coreService.update<Match>('matches', matchId, updates);
    const updated = await this.getMatch(matchId);
    return updated;
  }

  /**
   * 删除匹配
   */
  public async deleteMatch(matchId: string): Promise<void> {
    await this.ensureInitialized();
    await this.coreService.delete('matches', matchId);
  }

  /**
   * 获取消息
   */
  public async getMessage(messageId: string): Promise<Message> {
    await this.ensureInitialized();
    const message = await this.coreService.findOne<Message>('messages', { id: messageId });
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    return message;
  }

  /**
   * 获取消息列表
   */
  public async getMessages(matchId?: string): Promise<Message[]> {
    await this.ensureInitialized();
    
    if (matchId) {
      const result = await this.coreService.query<Message>('messages', {
        where: {
          field: 'matchId',
          operator: '==',
          value: matchId
        }
      });
      return result;
    }
    
    const result = await this.coreService.query<Message>('messages', {});
    return result;
  }

  /**
   * 获取未读消息
   */
  public async getUnreadMessages(userId: string): Promise<Message[]> {
    await this.ensureInitialized();
    const result = await this.coreService.query<Message>('messages', {
      where: [
        {
          field: 'receiverId',
          operator: '==',
          value: userId
        },
        {
          field: 'status',
          operator: '!=',
          value: 'read'
        }
      ]
    });
    return result;
  }

  /**
   * 创建消息
   */
  public async createMessage(message: Message): Promise<Message> {
    await this.ensureInitialized();
    return this.coreService.insert<Message>('messages', message);
  }

  /**
   * 更新消息
   */
  public async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
    await this.ensureInitialized();
    await this.coreService.update<Message>('messages', messageId, updates);
    const updated = await this.getMessage(messageId);
    return updated;
  }

  /**
   * 删除消息
   */
  public async deleteMessage(messageId: string): Promise<void> {
    await this.ensureInitialized();
    await this.coreService.delete('messages', messageId);
  }

  /**
   * 批量创建用户
   */
  public async bulkCreateUsers(users: User[]): Promise<User[]> {
    await this.ensureInitialized();
    const createdUsers: User[] = [];
    
    for (const user of users) {
      const result = await this.createUser(user);
      createdUsers.push(result);
    }
    
    return createdUsers;
  }

  /**
   * 批量创建匹配
   */
  public async bulkCreateMatches(matches: Match[]): Promise<Match[]> {
    await this.ensureInitialized();
    const createdMatches: Match[] = [];
    
    for (const match of matches) {
      const result = await this.createMatch(match);
      createdMatches.push(result);
    }
    
    return createdMatches;
  }

  /**
   * 批量创建消息
   */
  public async bulkCreateMessages(messages: Message[]): Promise<Message[]> {
    await this.ensureInitialized();
    const createdMessages: Message[] = [];
    
    for (const message of messages) {
      const result = await this.createMessage(message);
      createdMessages.push(result);
    }
    
    return createdMessages;
  }

  /**
   * 通用获取单个实体
   */
  public async get<T extends BaseEntity>(tableName: string, id: string): Promise<T> {
    await this.ensureInitialized();
    const item = await this.coreService.findOne<T>(tableName, { id });
    if (!item) {
      throw new Error(`Item with ID ${id} not found in table ${tableName}`);
    }
    return item;
  }

  /**
   * 通用获取实体列表
   */
  public async getAll<T extends BaseEntity>(tableName: string): Promise<T[]> {
    await this.ensureInitialized();
    const result = await this.coreService.query<T>(tableName, {});
    return result;
  }

  /**
   * 通用创建实体
   */
  public async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    await this.ensureInitialized();
    return this.coreService.insert<T>(tableName, data);
  }

  /**
   * 通用更新实体
   */
  public async update<T extends BaseEntity>(tableName: string, id: string, updates: Partial<T>): Promise<T> {
    await this.ensureInitialized();
    await this.coreService.update<T>(tableName, id, updates);
    return this.get<T>(tableName, id);
  }

  /**
   * 通用删除实体
   */
  public async delete(tableName: string, id: string): Promise<void> {
    await this.ensureInitialized();
    await this.coreService.delete(tableName, id);
  }

  /**
   * 确保服务已初始化
   * @private
   */
  private async ensureInitialized(): Promise<void> {
    if (!this._isInitialized) {
      await this.initialize();
    }
  }
} 