import { DatabaseClientType } from '@/core/lib/db/factory';
import { MatchRepository } from '@/core/lib/db/repositories/match-repository';
import { MessageRepository } from '@/core/lib/db/repositories/message-repository';
import { UserRepository } from '@/core/lib/db/repositories/user-repository';
import { DatabaseService as CoreDatabaseService } from '@/core/lib/db/service';
import { SyncManager } from '@/core/lib/db/sync/sync-manager';
import { User, Match, Message, BaseEntity } from '@/core/lib/db/types';
import { SyncState, SyncPriority } from '@/core/lib/db/types/sync-flags';

import { IDataService } from './data-service-interface';
import { NetworkService } from './network-service';


/**
 * 环境配置类型
 * 定义不同环境下的配置选项
 */
export interface EnvironmentConfig {
  /** 是否启用同步功能 */
  enableSync: boolean;
  /** 同步间隔时间（毫秒） */
  syncIntervalMs: number;
  /** 是否在网络连接时自动同步 */
  autoSyncOnConnect: boolean;
  /** 同步的实体类型 */
  syncEntityTypes: string[];
  /** 是否启用调试日志 */
  enableDebugLogs: boolean;
  /** 数据库客户端类型 */
  dbClientType: string;
  /** 是否使用混合客户端 */
  useHybridClient?: boolean;
  /** 混合客户端配置 */
  hybridConfig?: {
    /** 同步策略：立即、定期或手动 */
    syncStrategy: 'immediate' | 'periodic' | 'manual';
    /** 冲突解决策略 */
    conflictResolution: 'client-wins' | 'server-wins' | 'last-write-wins';
  };
}

// Delete operations need to handle changes when an entity has already been deleted
// markForDeletion is not directly available in SyncManager
interface DeletedEntity extends BaseEntity {
  _isDeleted: boolean;
}

/**
 * 数据库服务
 * 负责与本地数据库交互并处理同步操作
 * 支持不同环境下的配置
 */
export class DatabaseService implements IDataService {
  private static instance: DatabaseService;
  private coreService: CoreDatabaseService;
  private userRepository: UserRepository | null = null;
  private matchRepository: MatchRepository | null = null;
  private messageRepository: MessageRepository | null = null;
  private syncManager: SyncManager | null = null;
  private networkService: NetworkService;
  private config: EnvironmentConfig;
  private _isInitialized = false;

  private constructor() {
    // 设置环境配置
    this.config = this.getEnvironmentConfig();
    
    // 获取核心数据库服务实例
    this.coreService = CoreDatabaseService.getInstance();
    
    // 获取网络服务实例
    this.networkService = NetworkService.getInstance();
    
    // 如果启用调试日志，记录配置信息
    if (this.config.enableDebugLogs) {
      console.log('DatabaseService 初始化，环境配置:', this.config);
    }
    
    // 注意：不再在构造函数中获取仓储实例
    // 仓储实例将在初始化后或首次使用时获取
  }

  /**
   * 获取环境配置
   * 根据当前环境变量确定配置
   */
  private getEnvironmentConfig(): EnvironmentConfig {
    // 获取环境类型
    const env = process.env.NEXT_PUBLIC_ENV || 'development';
    const dbEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
    const useHybrid = process.env.NEXT_PUBLIC_USE_HYBRID_CLIENT === 'true';
    
    // 基础配置
    const baseConfig: EnvironmentConfig = {
      enableSync: dbEnv !== 'mock', // 在mock环境下禁用同步
      syncIntervalMs: 60000, // 默认1分钟
      autoSyncOnConnect: true,
      syncEntityTypes: ['users', 'matches', 'messages'],
      enableDebugLogs: false,
      dbClientType: DatabaseClientType.MOCK_INDEXEDDB,
      useHybridClient: useHybrid,
      hybridConfig: {
        syncStrategy: 'periodic',
        conflictResolution: 'last-write-wins'
      }
    };
    
    // 根据环境类型调整配置
    switch (env) {
      case 'production':
        return {
          ...baseConfig,
          enableSync: dbEnv !== 'mock' && true,
          syncIntervalMs: 300000, // 生产环境下5分钟同步一次，减少服务器负载
          enableDebugLogs: false,
          dbClientType: useHybrid ? 
            DatabaseClientType.HYBRID :
            (dbEnv === 'production' ? 
              (typeof window !== 'undefined' && 'capacitor' in window ? 
                DatabaseClientType.CAPACITOR_SQLITE : 
                DatabaseClientType.INDEXEDDB) : 
              DatabaseClientType.MOCK_INDEXEDDB),
          hybridConfig: {
            syncStrategy: 'periodic', 
            conflictResolution: 'server-wins'
          }
        };
        
      case 'test':
        return {
          ...baseConfig,
          enableSync: false, // 测试环境禁用同步
          enableDebugLogs: true,
          dbClientType: DatabaseClientType.MOCK,
          useHybridClient: false // 测试环境不使用混合客户端
        };
        
      case 'development':
      default:
        return {
          ...baseConfig,
          syncIntervalMs: 30000, // 开发环境30秒同步一次，方便调试
          enableDebugLogs: true,
          dbClientType: useHybrid ? 
            DatabaseClientType.HYBRID :
            (dbEnv === 'local' ? 
              DatabaseClientType.INDEXEDDB : 
              DatabaseClientType.MOCK_INDEXEDDB),
          hybridConfig: {
            syncStrategy: 'immediate', // 开发环境下使用即时同步便于调试
            conflictResolution: 'last-write-wins'
          }
        };
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * 初始化数据库服务
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) return;

    try {
      // 初始化核心数据库服务
      await this.coreService.initialize();
      
      // 初始化仓储实例 - 在核心服务初始化后才获取
      this.userRepository = this.coreService.getUserRepository();
      this.matchRepository = this.coreService.getMatchRepository();
      this.messageRepository = this.coreService.getMessageRepository();
      
      // 根据配置初始化同步管理器
      if (this.config.enableSync) {
        const dbEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
        
        // 确保在mock环境下不创建SyncManager
        if (dbEnv !== 'mock') {
          try {
            this.syncManager = new SyncManager({
              client: this.coreService as any, // Type casting to avoid interface mismatch
              networkManager: this.networkService as any, // Cast to match expected interface
              entityTypes: this.config.syncEntityTypes,
              autoSyncOnConnect: this.config.autoSyncOnConnect,
              syncIntervalMs: this.config.syncIntervalMs,
            });
            
            if (this.config.enableDebugLogs) {
              console.log('同步管理器初始化完成，配置:', {
                autoSyncOnConnect: this.config.autoSyncOnConnect,
                syncIntervalMs: this.config.syncIntervalMs,
                entityTypes: this.config.syncEntityTypes
              });
            }
          } catch (error) {
            console.warn('初始化同步管理器失败，将以离线模式运行:', error);
          }
        } else {
          console.log('Mock环境下跳过创建同步管理器');
        }
      } else if (this.config.enableDebugLogs) {
        console.log('同步功能已禁用，跳过同步管理器初始化');
      }
      
      this._isInitialized = true;
      
      if (this.config.enableDebugLogs) {
        console.log('DatabaseService 初始化完成');
      }
    } catch (error) {
      console.error('Error initializing database service:', error);
      throw error;
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
      
      if (this.config.enableDebugLogs) {
        console.log('DatabaseService 已关闭');
      }
    } catch (error) {
      console.error('Error closing database service:', error);
      throw error;
    }
  }

  /**
   * 清空数据库
   */
  public async clearAll(): Promise<void> {
    this.checkInitialized();
    await this.coreService.clear();
    
    if (this.config.enableDebugLogs) {
      console.log('数据库已清空');
    }
  }

  /**
   * 切换同步功能启用状态
   * @param enable 是否启用同步
   */
  public async toggleSync(enable: boolean): Promise<void> {
    if (this.config.enableSync === enable) return;
    
    this.config.enableSync = enable;
    
    if (enable && !this.syncManager) {
      // 检查是否是mock环境
      const dbEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
      if (dbEnv === 'mock') {
        console.log('Mock环境下不能启用同步功能');
        return;
      }
      
      // 创建同步管理器
      try {
        this.syncManager = new SyncManager({
          client: this.coreService as any,
          networkManager: this.networkService as any, // Cast to match expected interface
          entityTypes: this.config.syncEntityTypes,
          autoSyncOnConnect: this.config.autoSyncOnConnect,
          syncIntervalMs: this.config.syncIntervalMs,
        });
        
        if (this.config.enableDebugLogs) {
          console.log('同步功能已启用');
        }
      } catch (error) {
        console.warn('启用同步功能失败:', error);
      }
    } else if (!enable && this.syncManager) {
      // 销毁同步管理器
      this.syncManager.dispose();
      this.syncManager = null;
      
      if (this.config.enableDebugLogs) {
        console.log('同步功能已禁用');
      }
    }
  }

  /**
   * 强制同步所有数据
   */
  public async forceSync(): Promise<void> {
    if (!this.syncManager) {
      throw new Error('同步管理器未初始化，无法执行同步操作');
    }
    
    // 使用sync方法而不是syncAll（根据实际SyncManager接口调整）
    await this.syncManager.sync();
    
    if (this.config.enableDebugLogs) {
      console.log('完成强制同步');
    }
  }

  /**
   * 标记实体为已删除
   * SyncManager没有直接的markForDeletion方法，所以我们需要用其他方式实现
   * @param id 实体ID
   * @param entityType 实体类型
   */
  private async markEntityForDeletion(id: string, entityType: string): Promise<void> {
    if (!this.syncManager || !this.config.enableSync) {
      return; // 如果同步未启用，直接返回
    }
    
    try {
      // 检查是否为离线专用表
      const isOfflineOnly = await this.isOfflineOnlyTable(entityType);
      if (isOfflineOnly) {
        return; // 离线专用表不需要同步删除操作
      }
      
      // 创建一个带有删除标记的伪实体
      const deletedEntity: DeletedEntity = {
        id,
        _isDeleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 使用markForSync将实体标记为已删除状态
      if (this.syncManager) {
        await this.syncManager.markForSync(
          deletedEntity,
          entityType,
          SyncState.DELETED,
          SyncPriority.HIGH
        );
        
        if (this.config.enableDebugLogs) {
          console.log(`实体 ${entityType}:${id} 已标记为删除`);
        }
      }
    } catch (error) {
      console.error(`标记实体 ${entityType}:${id} 为删除状态时出错:`, error);
    }
  }

  /**
   * 判断表是否为离线专用表
   * @param tableName 表名
   */
  public async isOfflineOnlyTable(tableName: string): Promise<boolean> {
    // 使用CoreDatabaseService的方法获取表结构信息
    // 如果getTableSchema不存在，可能需要通过其他方式获取这个信息
    try {
      const tableSchema = await (this.coreService as any).getTableSchema?.(tableName);
      return tableSchema?.syncConfig?.offlineOnly === true;
    } catch (error) {
      console.error(`Error checking if table ${tableName} is offline only:`, error);
      return false; // 默认不是离线专用表
    }
  }

  /**
   * 获取数据库客户端实例
   */
  public getDatabaseClient() {
    this.checkInitialized();
    return this.coreService;
  }

  // User operations
  /**
   * 获取用户信息
   * @param userId 用户ID
   */
  public async getUser(userId: string): Promise<User> {
    this.checkInitialized();
    const user = await this.getUserRepository().findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * 获取所有用户
   */
  public async getUsers(): Promise<User[]> {
    this.checkInitialized();
    return this.getUserRepository().findAll();
  }

  /**
   * 创建用户
   * @param user 用户数据
   */
  public async createUser(user: User): Promise<User> {
    this.checkInitialized();
    const createdUser = await this.getUserRepository().create(user);
    
    // 标记为需要同步（如果同步已启用且不是离线专用表）
    if (this.syncManager && this.config.enableSync) {
      await this.syncManager.markForSync(createdUser, 'users');
    }
    
    return createdUser;
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param data 更新数据
   */
  public async updateUser(id: string, data: Partial<User>): Promise<User> {
    this.checkInitialized();
    await this.getUserRepository().update(id, data);
    
    // 获取更新后的用户
    const updatedUser = await this.getUserRepository().findById(id);
    if (!updatedUser) {
      throw new Error(`用户 ${id} 不存在或更新失败`);
    }
    
    // 标记为需要同步（如果同步已启用且不是离线专用表）
    if (this.syncManager && this.config.enableSync) {
      await this.syncManager.markForSync(updatedUser, 'users');
    }
    
    return updatedUser;
  }

  /**
   * 删除用户
   * @param id 用户ID
   */
  public async deleteUser(id: string): Promise<void> {
    this.checkInitialized();
    await this.getUserRepository().delete(id);
    
    // 使用我们的自定义方法标记用户为已删除状态
    await this.markEntityForDeletion(id, 'users');
  }

  // Match operations
  /**
   * 获取匹配信息
   * @param matchId 匹配ID
   */
  public async getMatch(matchId: string): Promise<Match> {
    this.checkInitialized();
    const match = await this.getMatchRepository().findById(matchId);
    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }
    return match;
  }

  /**
   * 获取用户的所有匹配
   * @param userId 用户ID
   */
  public async getMatches(userId?: string): Promise<Match[]> {
    this.checkInitialized();
    if (userId) {
      return this.getMatchRepository().findByUserId(userId);
    }
    return this.getMatchRepository().findAll();
  }

  /**
   * 创建匹配
   * @param match 匹配数据
   */
  public async createMatch(match: Match): Promise<Match> {
    this.checkInitialized();
    const createdMatch = await this.getMatchRepository().create(match);
    
    // 标记为需要同步（如果同步已启用且不是离线专用表）
    if (this.syncManager && this.config.enableSync) {
      await this.syncManager.markForSync(createdMatch, 'matches');
    }
    
    return createdMatch;
  }

  /**
   * 更新匹配信息
   * @param id 匹配ID
   * @param data 更新数据
   */
  public async updateMatch(id: string, data: Partial<Match>): Promise<Match> {
    this.checkInitialized();
    await this.getMatchRepository().update(id, data);
    
    // 获取更新后的匹配
    const updatedMatch = await this.getMatchRepository().findById(id);
    if (!updatedMatch) {
      throw new Error(`匹配 ${id} 不存在或更新失败`);
    }
    
    // 标记为需要同步（如果同步已启用且不是离线专用表）
    if (this.syncManager && this.config.enableSync) {
      await this.syncManager.markForSync(updatedMatch, 'matches');
    }
    
    return updatedMatch;
  }

  /**
   * 删除匹配
   * @param id 匹配ID
   */
  public async deleteMatch(id: string): Promise<void> {
    this.checkInitialized();
    await this.getMatchRepository().delete(id);
    
    // 使用我们的自定义方法标记匹配为已删除状态
    await this.markEntityForDeletion(id, 'matches');
  }

  // Message operations
  /**
   * 获取消息信息
   * @param messageId 消息ID
   */
  public async getMessage(messageId: string): Promise<Message> {
    this.checkInitialized();
    const message = await this.getMessageRepository().findById(messageId);
    if (!message) {
      throw new Error(`Message with ID ${messageId} not found`);
    }
    return message;
  }

  /**
   * 获取匹配的所有消息
   * @param matchId 匹配ID
   */
  public async getMessages(matchId?: string): Promise<Message[]> {
    this.checkInitialized();
    if (matchId) {
      return this.getMessageRepository().findByMatchId(matchId);
    }
    return this.getMessageRepository().findAll();
  }

  /**
   * 获取未读消息
   * @param userId 用户ID
   */
  public async getUnreadMessages(userId: string): Promise<Message[]> {
    this.checkInitialized();
    const allMessages = await this.getMessageRepository().findAll();
    return allMessages.filter(msg => 
      msg.receiverId === userId && msg.status !== 'read'
    );
  }

  /**
   * 创建消息
   * @param message 消息数据
   */
  public async createMessage(message: Message): Promise<Message> {
    this.checkInitialized();
    const createdMessage = await this.getMessageRepository().create(message);
    
    // 标记为需要同步（如果同步已启用且不是离线专用表）
    if (this.syncManager && this.config.enableSync) {
      await this.syncManager.markForSync(createdMessage, 'messages');
    }
    
    return createdMessage;
  }

  /**
   * 更新消息信息
   * @param id 消息ID
   * @param data 更新数据
   */
  public async updateMessage(id: string, data: Partial<Message>): Promise<Message> {
    this.checkInitialized();
    await this.getMessageRepository().update(id, data);
    
    // 获取更新后的消息
    const updatedMessage = await this.getMessageRepository().findById(id);
    if (!updatedMessage) {
      throw new Error(`消息 ${id} 不存在或更新失败`);
    }
    
    // 标记为需要同步（如果同步已启用且不是离线专用表）
    if (this.syncManager && this.config.enableSync) {
      await this.syncManager.markForSync(updatedMessage, 'messages');
    }
    
    return updatedMessage;
  }

  /**
   * 删除消息
   * @param id 消息ID
   */
  public async deleteMessage(id: string): Promise<void> {
    this.checkInitialized();
    await this.getMessageRepository().delete(id);
    
    // 使用我们的自定义方法标记消息为已删除状态
    await this.markEntityForDeletion(id, 'messages');
  }

  // Generic data operations
  /**
   * 获取通用数据
   * @param tableName 表名
   * @param id 数据ID
   */
  public async get<T extends BaseEntity>(tableName: string, id: string): Promise<T> {
    this.checkInitialized();
    const result = await this.coreService.findOne<T>(tableName, { id });
    if (!result) {
      throw new Error(`未找到ID为 ${id} 的 ${tableName} 记录`);
    }
    return result;
  }

  /**
   * 获取表中所有数据
   * @param tableName 表名
   */
  public async getAll<T extends BaseEntity>(tableName: string): Promise<T[]> {
    this.checkInitialized();
    return await this.coreService.query<T>(tableName, {});
  }

  /**
   * 创建通用数据
   * @param tableName 表名
   * @param data 数据
   */
  public async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    const result = await this.coreService.insert<T>(tableName, data);
    
    // 标记为需要同步（如果同步已启用且不是离线专用表）
    if (this.syncManager && this.config.enableSync) {
      const isOfflineOnly = await this.isOfflineOnlyTable(tableName);
      if (!isOfflineOnly) {
        await this.syncManager.markForSync(result, tableName);
      }
    }
    
    return result;
  }

  /**
   * 更新通用数据
   * @param tableName 表名
   * @param id 数据ID
   * @param updates 更新数据
   */
  public async update<T extends BaseEntity>(tableName: string, id: string, updates: Partial<T>): Promise<T> {
    this.checkInitialized();
    await this.coreService.update<T>(tableName, id, updates);
    
    // 获取更新后的数据
    const updatedData = await this.coreService.findOne<T>(tableName, { id });
    if (!updatedData) {
      throw new Error(`未找到ID为 ${id} 的 ${tableName} 记录`);
    }
    
    // 标记为需要同步（如果同步已启用且不是离线专用表）
    if (this.syncManager && this.config.enableSync) {
      const isOfflineOnly = await this.isOfflineOnlyTable(tableName);
      if (!isOfflineOnly) {
        await this.syncManager.markForSync(updatedData, tableName);
      }
    }
    
    return updatedData;
  }

  /**
   * 删除通用数据
   * @param tableName 表名
   * @param id 数据ID
   */
  public async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    await this.coreService.delete(tableName, id);
    
    // 使用我们的自定义方法标记实体为已删除状态
    await this.markEntityForDeletion(id, tableName);
  }

  /**
   * 执行批量操作
   * @param tableName 表名
   * @param entities 实体数据列表
   */
  public async bulkCreate<T extends BaseEntity>(tableName: string, entities: T[]): Promise<T[]> {
    this.checkInitialized();
    const results: T[] = [];
    
    // 批量插入
    for (const entity of entities) {
      const result = await this.create(tableName, entity);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 批量创建用户
   * @param users 用户列表
   */
  public async bulkCreateUsers(users: User[]): Promise<User[]> {
    return this.bulkCreate<User>('users', users);
  }

  /**
   * 批量创建匹配
   * @param matches 匹配列表
   */
  public async bulkCreateMatches(matches: Match[]): Promise<Match[]> {
    return this.bulkCreate<Match>('matches', matches);
  }

  /**
   * 批量创建消息
   * @param messages 消息列表
   */
  public async bulkCreateMessages(messages: Message[]): Promise<Message[]> {
    return this.bulkCreate<Message>('messages', messages);
  }

  /**
   * 手动同步
   * 这是为了与IDataService接口兼容
   */
  public async sync(): Promise<void> {
    return this.forceSync();
  }

  /**
   * 检查服务是否已初始化
   * @private
   */
  private checkInitialized(): void {
    if (!this._isInitialized) {
      throw new Error('数据库服务未初始化');
    }
  }

  /**
   * 获取用户仓储
   */
  private getUserRepository(): UserRepository {
    this.checkInitialized();
    if (!this.userRepository) {
      this.userRepository = this.coreService.getUserRepository();
    }
    return this.userRepository;
  }

  /**
   * 获取匹配仓储
   */
  private getMatchRepository(): MatchRepository {
    this.checkInitialized();
    if (!this.matchRepository) {
      this.matchRepository = this.coreService.getMatchRepository();
    }
    return this.matchRepository;
  }

  /**
   * 获取消息仓储
   */
  private getMessageRepository(): MessageRepository {
    this.checkInitialized();
    if (!this.messageRepository) {
      this.messageRepository = this.coreService.getMessageRepository();
    }
    return this.messageRepository;
  }
}