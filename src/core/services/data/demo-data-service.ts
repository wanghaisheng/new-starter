import { MockDataService } from './mock-data-service';
import { User, Match, Message, BaseEntity } from '@/core/lib/db/types';
import { Logger } from '@/core/lib/utils/logger';
import { IDataService } from './data-service-interface';
import { BatchOperation } from '@/core/lib/db/types/database.types';

/**
 * 配置选项接口
 */
export interface DemoDataServiceConfig {
  /**
   * 是否在初始化时加载演示数据
   * @default true
   */
  loadDemoData?: boolean;
  
  /**
   * 演示数据源
   * - 'example': 使用内置的示例数据
   * - 'dating': 使用约会应用示例数据
   * - 'custom': 使用自定义数据源
   * @default 'example'
   */
  demoDataSource?: 'example' | 'dating' | 'custom';
  
  /**
   * 自定义数据源路径（当demoDataSource为'custom'时使用）
   */
  customDataPath?: string;
  
  /**
   * Mock模式配置
   */
  mockMode?: 'memory' | 'json';
  
  /**
   * JSON文件路径（当mockMode为'json'时使用）
   */
  jsonFilePath?: string;
  
  /**
   * 是否自动保存对JSON文件的更改
   */
  autoSave?: boolean;
}

/**
 * 演示数据服务
 * 提供演示数据加载功能
 */
export class DemoDataService implements IDataService {
  private static _instance: DemoDataService | null = null;
  private logger: Logger;
  private config: Required<Pick<DemoDataServiceConfig, 'loadDemoData' | 'demoDataSource' | 'customDataPath' | 'mockMode' | 'jsonFilePath' | 'autoSave'>>;
  private mockDataService: MockDataService;
  
  private constructor(serviceConfig: DemoDataServiceConfig) {
    this.logger = new Logger('DemoDataService');
    
    // 设置默认配置
    this.config = {
      loadDemoData: serviceConfig.loadDemoData ?? true,
      demoDataSource: serviceConfig.demoDataSource || 'example',
      customDataPath: serviceConfig.customDataPath || '',
      mockMode: serviceConfig.mockMode || 'memory',
      jsonFilePath: serviceConfig.jsonFilePath || '',
      autoSave: serviceConfig.autoSave ?? true
    };
    
    // 创建MockDataService实例
    this.mockDataService = MockDataService.getInstance({
      mockMode: this.config.mockMode,
      jsonFilePath: this.config.jsonFilePath,
      autoSave: this.config.autoSave
    });
  }
  
  /**
   * 获取DemoDataService实例
   * @param config 配置选项
   * @returns DemoDataService实例
   */
  public static getInstance(config?: DemoDataServiceConfig): DemoDataService {
    if (!DemoDataService._instance) {
      DemoDataService._instance = new DemoDataService(config || {
        mockMode: 'memory',
        loadDemoData: true
      });
    }
    return DemoDataService._instance;
  }
  
  /**
   * 初始化数据服务并加载演示数据
   */
  public async initialize(): Promise<void> {
    // 先初始化MockDataService
    await this.mockDataService.initialize();
    
    // 如果配置为加载演示数据，则加载
    if (this.config.loadDemoData) {
      await this.loadDemoData();
    }
  }
  
  /**
   * 检查服务是否已初始化
   */
  public isInitialized(): boolean {
    return this.mockDataService.isInitialized();
  }
  
  /**
   * 加载演示数据
   */
  public async loadDemoData(): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('DemoDataService not initialized');
    }
    
    try {
      this.logger.info('开始加载演示数据...');
      
      // 根据配置选择数据源
      let demoData: any;
      
      switch (this.config.demoDataSource) {
        case 'dating':
          demoData = await this.loadDatingDemoData();
          break;
        case 'custom':
          if (!this.config.customDataPath) {
            throw new Error('自定义数据源路径未指定');
          }
          demoData = await this.loadCustomDemoData(this.config.customDataPath);
          break;
        case 'example':
        default:
          demoData = await this.loadExampleDemoData();
          break;
      }
      
      // 加载用户数据
      if (demoData.users && demoData.users.length > 0) {
        this.logger.info(`加载 ${demoData.users.length} 个用户数据`);
        for (const userData of demoData.users) {
          await this.mockDataService.createUser(userData as User);
        }
      }
      
      // 加载匹配数据
      if (demoData.matches && demoData.matches.length > 0) {
        this.logger.info(`加载 ${demoData.matches.length} 个匹配数据`);
        for (const matchData of demoData.matches) {
          await this.mockDataService.createMatch(matchData as Match);
        }
      }
      
      // 加载消息数据
      if (demoData.messages && demoData.messages.length > 0) {
        this.logger.info(`加载 ${demoData.messages.length} 个消息数据`);
        for (const messageData of demoData.messages) {
          await this.mockDataService.createMessage(messageData as Message);
        }
      }
      
      this.logger.info('演示数据加载完成');
    } catch (error) {
      this.logger.error('加载演示数据失败', { error });
      throw error;
    }
  }
  
  /**
   * 加载示例演示数据
   */
  private async loadExampleDemoData(): Promise<any> {
    try {
      // 导入示例数据
      const exampleData = await import('@/core/lib/db/clients/mock/example-data.json');
      return exampleData;
    } catch (error) {
      this.logger.error('加载示例数据失败', { error });
      throw error;
    }
  }
  
  /**
   * 加载约会应用演示数据
   */
  private async loadDatingDemoData(): Promise<any> {
    try {
      // 导入约会应用示例数据
      const datingData = await import('@/core/lib/db/clients/mock/data/dating-data.json');
      return datingData;
    } catch (error) {
      this.logger.error('加载约会应用示例数据失败', { error });
      throw error;
    }
  }
  
  /**
   * 加载自定义演示数据
   * @param dataPath 数据文件路径
   */
  private async loadCustomDemoData(dataPath: string): Promise<any> {
    try {
      // 导入自定义数据
      const customData = await import(dataPath);
      return customData;
    } catch (error) {
      this.logger.error('加载自定义数据失败', { error, dataPath });
      throw error;
    }
  }
  
  /**
   * 清除所有数据
   */
  public async clearAll(): Promise<void> {
    await this.mockDataService.clearAll();
    this.logger.info('所有数据已清除');
  }
  
  /**
   * 获取用户
   * @param userId 用户ID
   */
  public async getUser(userId: string): Promise<User> {
    return this.mockDataService.getUser(userId);
  }
  
  /**
   * 根据ID获取用户
   * @param userId 用户ID
   */
  public async getUserById(userId: string): Promise<User | null> {
    return this.mockDataService.getUserById(userId);
  }
  
  /**
   * 通过邮箱获取用户
   * @param email 用户邮箱
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    return this.mockDataService.getUserByEmail(email);
  }
  
  /**
   * 通过手机号获取用户
   * @param phoneNumber 用户手机号
   */
  public async getUserByPhone(phoneNumber: string): Promise<User | null> {
    return this.mockDataService.getUserByPhone(phoneNumber);
  }
  
  /**
   * 获取所有用户
   */
  public async getUsers(): Promise<User[]> {
    return this.mockDataService.getUsers();
  }
  
  /**
   * 根据ID列表获取多个用户
   * @param userIds 用户ID列表
   */
  public async getUsersByIds(userIds: string[]): Promise<User[]> {
    return this.mockDataService.getUsersByIds(userIds);
  }
  
  /**
   * 创建用户
   * @param user 用户数据
   */
  public async createUser(user: User): Promise<User> {
    return this.mockDataService.createUser(user);
  }
  
  /**
   * 批量创建用户
   * @param users 用户列表
   */
  public async bulkCreateUsers(users: User[]): Promise<User[]> {
    return this.mockDataService.bulkCreateUsers(users);
  }
  
  /**
   * 更新用户
   * @param userId 用户ID
   * @param updates 更新的数据
   */
  public async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return this.mockDataService.updateUser(userId, updates);
  }
  
  /**
   * 删除用户
   * @param userId 用户ID
   */
  public async deleteUser(userId: string): Promise<void> {
    return this.mockDataService.deleteUser(userId);
  }
  
  /**
   * 获取匹配
   * @param matchId 匹配ID
   */
  public async getMatch(matchId: string): Promise<Match> {
    return this.mockDataService.getMatch(matchId);
  }
  
  /**
   * 获取所有匹配
   * @param userId 可选用户ID过滤器
   */
  public async getMatches(userId?: string): Promise<Match[]> {
    return this.mockDataService.getMatches(userId);
  }
  
  /**
   * 创建匹配
   * @param match 匹配数据
   */
  public async createMatch(match: Match): Promise<Match> {
    return this.mockDataService.createMatch(match);
  }
  
  /**
   * 批量创建匹配
   * @param matches 匹配列表
   */
  public async bulkCreateMatches(matches: Match[]): Promise<Match[]> {
    return this.mockDataService.bulkCreateMatches(matches);
  }
  
  /**
   * 更新匹配
   * @param matchId 匹配ID
   * @param updates 更新的数据
   */
  public async updateMatch(matchId: string, updates: Partial<Match>): Promise<Match> {
    return this.mockDataService.updateMatch(matchId, updates);
  }
  
  /**
   * 删除匹配
   * @param matchId 匹配ID
   */
  public async deleteMatch(matchId: string): Promise<void> {
    return this.mockDataService.deleteMatch(matchId);
  }
  
  /**
   * 获取消息
   * @param messageId 消息ID
   */
  public async getMessage(messageId: string): Promise<Message> {
    return this.mockDataService.getMessage(messageId);
  }
  
  /**
   * 获取所有消息
   * @param matchId 可选匹配ID过滤器
   */
  public async getMessages(matchId?: string): Promise<Message[]> {
    return this.mockDataService.getMessages(matchId);
  }
  
  /**
   * 获取未读消息
   * @param userId 用户ID
   */
  public async getUnreadMessages(userId: string): Promise<Message[]> {
    return this.mockDataService.getUnreadMessages(userId);
  }
  
  /**
   * 创建消息
   * @param message 消息数据
   */
  public async createMessage(message: Message): Promise<Message> {
    return this.mockDataService.createMessage(message);
  }
  
  /**
   * 批量创建消息
   * @param messages 消息列表
   */
  public async bulkCreateMessages(messages: Message[]): Promise<Message[]> {
    return this.mockDataService.bulkCreateMessages(messages);
  }
  
  /**
   * 更新消息
   * @param messageId 消息ID
   * @param updates 更新的数据
   */
  public async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message> {
    return this.mockDataService.updateMessage(messageId, updates);
  }
  
  /**
   * 删除消息
   * @param messageId 消息ID
   */
  public async deleteMessage(messageId: string): Promise<void> {
    return this.mockDataService.deleteMessage(messageId);
  }
  
  /**
   * 获取通用数据
   * @param tableName 表名
   * @param id 数据ID
   */
  public async get<T extends BaseEntity>(tableName: string, id: string): Promise<T> {
    return this.mockDataService.get<T>(tableName, id);
  }
  
  /**
   * 获取所有通用数据
   * @param tableName 表名
   */
  public async getAll<T extends BaseEntity>(tableName: string): Promise<T[]> {
    return this.mockDataService.getAll<T>(tableName);
  }
  
  /**
   * 创建通用数据
   * @param tableName 表名
   * @param data 数据
   */
  public async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    return this.mockDataService.create<T>(tableName, data);
  }
  
  /**
   * 更新通用数据
   * @param tableName 表名
   * @param id 数据ID
   * @param updates 更新的数据
   */
  public async update<T extends BaseEntity>(tableName: string, id: string, updates: Partial<T>): Promise<T> {
    return this.mockDataService.update<T>(tableName, id, updates);
  }
  
  /**
   * 删除通用数据
   * @param tableName 表名
   * @param id 数据ID
   */
  public async delete(tableName: string, id: string): Promise<void> {
    return this.mockDataService.delete(tableName, id);
  }
  
  /**
   * 同步数据
   */
  public async sync(): Promise<void> {
    return this.mockDataService.sync();
  }
  
  /**
   * 检查表是否为离线表
   * @param tableName 表名
   */
  public async isOfflineOnlyTable(tableName: string): Promise<boolean> {
    return this.mockDataService.isOfflineOnlyTable(tableName);
  }
  
  /**
   * 连接数据库
   */
  public async connect(): Promise<void> {
    // 在DemoDataService中，connect方法等同于initialize
    return this.initialize();
  }
  
  /**
   * 断开数据库连接
   */
  public async disconnect(): Promise<void> {
    // 在DemoDataService中，disconnect方法等同于clearAll
    return this.clearAll();
  }
  
  /**
   * 清除数据
   */
  public async clear(): Promise<void> {
    return this.clearAll();
  }
  
  /**
   * 开始事务
   */
  public async beginTransaction(): Promise<void> {
    // 在DemoDataService中，事务操作直接委托给MockDataService
    // 这里需要实现事务支持
    this.logger.warn('事务操作在DemoDataService中未实现');
  }
  
  /**
   * 提交事务
   */
  public async commitTransaction(): Promise<void> {
    // 在DemoDataService中，事务操作直接委托给MockDataService
    // 这里需要实现事务支持
    this.logger.warn('事务操作在DemoDataService中未实现');
  }
  
  /**
   * 回滚事务
   */
  public async rollbackTransaction(): Promise<void> {
    // 在DemoDataService中，事务操作直接委托给MockDataService
    // 这里需要实现事务支持
    this.logger.warn('事务操作在DemoDataService中未实现');
  }
  
  /**
   * 批处理操作
   * @param tableName 表名
   * @param operations 操作列表
   */
  public async batch<T>(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    // 在DemoDataService中，批处理操作直接委托给MockDataService
    // 这里需要实现批处理支持
    this.logger.warn('批处理操作在DemoDataService中未实现');
  }
  
  /**
   * 执行原始查询
   * @param query 查询语句
   * @param params 参数
   */
  public async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> {
    // 在DemoDataService中，原始查询直接委托给MockDataService
    // 这里需要实现原始查询支持
    this.logger.warn('原始查询在DemoDataService中未实现');
    return [];
  }
} 