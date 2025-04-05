import { NetworkService } from '@/core/services/network-service';
import { BaseSyncClient } from '@/core/lib/db/clients/sync/base-sync-client';
import { IDatabaseClient, SyncStrategy } from '@/core/lib/db/interfaces';
import { User, Match, Message } from '@/core/lib/db/types';
import { HybridDatabaseConfig, SyncConfig, QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database.types';
import { BaseEntity } from '@/core/lib/db/types/base-entity';

type EntityWithId = { id: string } & Record<string, any>;

/**
 * 混合数据库客户端
 * 
 * 支持同时使用本地客户端和远程客户端，提供在线/离线数据访问和自动同步功能。
 * 可根据配置的同步策略确定数据存取的优先顺序和同步行为。
 * 
 * @example
 * ```typescript
 * // 创建本地和远程客户端
 * const localClient = new IndexedDBClient({ ... });
 * const remoteClient = new FirebaseClient({ ... });
 * 
 * // 创建混合客户端配置
 * const config: HybridDatabaseConfig = {
 *   engine: 'hybrid',
 *   sync: {
 *     enabled: true,
 *     strategy: 'periodic',
 *     localClient,
 *     remoteClient,
 *     syncIntervalMs: 60000
 *   }
 * };
 * 
 * // 初始化混合客户端
 * const hybridClient = new HybridDatabaseClient(config);
 * await hybridClient.initialize();
 * ```
 */
export class HybridDatabaseClient extends BaseSyncClient implements IDatabaseClient {
  protected localClient: IDatabaseClient;
  protected remoteClient: IDatabaseClient;
  protected syncStrategy: SyncStrategy;
  private initialized: boolean = false;
  protected isOnline: boolean = true;
  protected pendingSync: Map<string, EntityWithId[]> = new Map();
  protected syncInProgress: boolean = false;
  protected syncInterval: NodeJS.Timeout | null = null;

  /**
   * 创建混合数据库客户端
   * 
   * @param config 混合数据库配置
   * @throws Error 如果配置中没有提供localClient或remoteClient
   */
  constructor(config: HybridDatabaseConfig) {
    // 确保配置包含sync属性
    const syncConfig: SyncConfig = config.sync || {
      enabled: true,
      strategy: 'periodic'
    };

    // 验证必要的客户端实例
    if (!syncConfig.localClient) {
      throw new Error('必须在配置中提供localClient');
    }

    if (!syncConfig.remoteClient) {
      throw new Error('必须在配置中提供remoteClient');
    }

    // 初始化基础同步客户端
    super(syncConfig);
    
    this.localClient = syncConfig.localClient;
    this.remoteClient = syncConfig.remoteClient;
    this.syncStrategy = syncConfig.strategy || 'periodic';
    
    // 监听网络状态变化
    this.setupNetworkListener();
    
    // 设置定期同步
    this.setupPeriodicSync(syncConfig.syncIntervalMs || 60000); // 默认每分钟同步一次
  }

  /**
   * 设置网络状态监听
   * 当网络状态变化时更新在线状态，并在恢复连接时自动同步待处理操作
   */
  protected setupNetworkListener(): void {
    // 使用网络服务监听网络状态变化
    const networkService = NetworkService.getInstance();
    // 注意：您可能需要确保NetworkService中有onNetworkStatusChange方法
    // 这里使用any类型暂时绕过类型检查
    (networkService as any).onNetworkStatusChange((status: any) => {
      const wasOffline = !this.isOnline;
      this.isOnline = status.connected;
      
      // 如果从离线变为在线，尝试同步待处理的操作
      if (wasOffline && this.isOnline) {
        this.syncPendingOperations();
      }
    });
  }

  /**
   * 设置定期同步
   * @param intervalMs 同步间隔，单位毫秒
   */
  protected setupPeriodicSync(intervalMs: number): void {
    // 清除现有的同步间隔
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // 设置新的同步间隔
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.pendingSync.size > 0) {
        this.syncPendingOperations();
      }
    }, intervalMs);
  }

  /**
   * 同步待处理操作
   * 将本地更改同步到远程服务器
   * @returns 同步是否成功
   */
  protected async syncPendingOperations(): Promise<boolean> {
    if (!this.isOnline || this.syncInProgress || this.pendingSync.size === 0) return false;
    
    this.syncInProgress = true;
    let success = true;
    
    try {
      // 同步所有待处理的操作
      for (const [collection, items] of Array.from(this.pendingSync.entries())) {
        const failedItems: any[] = [];
        
        for (const item of items) {
          try {
            // 根据不同的集合类型执行不同的同步操作
            // 注意：这里假设IDatabaseClient接口中有saveEntity和deleteEntity方法
            // 如果没有，您需要根据实际接口进行调整
            switch (collection) {
              case 'users':
                await this.remoteClient.update('users', item.id, item);
                break;
              case 'matches':
                await this.remoteClient.update('matches', item.id, item);
                break;
              case 'messages':
                await this.remoteClient.update('messages', item.id, item);
                break;
              case 'deletedUsers':
                await this.remoteClient.delete('users', item.id);
                break;
              case 'deletedMatches':
                await this.remoteClient.delete('matches', item.id);
                break;
              case 'deletedMessages':
                await this.remoteClient.delete('messages', item.id);
                break;
              default:
                console.warn(`未知的集合类型: ${collection}`);
                break;
            }
          } catch (error) {
            console.error(`同步操作失败: ${collection}`, error);
            failedItems.push(item);
            success = false;
          }
        }
        
        // 更新待处理列表，只保留失败的项目
        if (failedItems.length > 0) {
          this.pendingSync.set(collection, failedItems);
        } else {
          this.pendingSync.delete(collection);
        }
      }
    } catch (error) {
      console.error('同步操作过程中发生错误', error);
      success = false;
    } finally {
      this.syncInProgress = false;
    }
    
    return success;
  }

  /**
   * 同步特定集合中的项目
   * @param collection 集合名称
   * @param items 待同步的项目
   */
  protected async syncCollectionItems(collection: string, items: any[]): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const failedItems: any[] = [];
      
      for (const item of items) {
        try {
          switch (collection) {
            case 'users':
              await this.remoteClient.update('users', item.id, item);
              break;
            case 'matches':
              await this.remoteClient.update('matches', item.id, item);
              break;
            case 'messages':
              await this.remoteClient.update('messages', item.id, item);
              break;
            case 'deletedUsers':
              await this.remoteClient.delete('users', item.id);
              break;
            case 'deletedMatches':
              await this.remoteClient.delete('matches', item.id);
              break;
            case 'deletedMessages':
              await this.remoteClient.delete('messages', item.id);
              break;
            default:
              console.warn(`未知的集合类型: ${collection}`);
              break;
          }
        } catch (error) {
          console.error(`同步操作失败: ${collection}`, error);
          failedItems.push(item);
        }
      }
      
      if (failedItems.length > 0) {
        this.pendingSync.set(collection, failedItems);
      } else {
        this.pendingSync.delete(collection);
      }
    } catch (error) {
      console.error(`同步集合失败: ${collection}`, error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 初始化数据库客户端
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 初始化本地客户端
    await this.localClient.initialize();
    
    // 如果在线，初始化远程客户端
    if (this.isOnline) {
      try {
        await this.remoteClient.initialize();
      } catch (error) {
        console.error('远程客户端初始化失败', error);
      }
    }

    this.initialized = true;
  }

  /**
   * 关闭数据库客户端
   */
  async close(): Promise<void> {
    // 清除同步间隔
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // 如果有待处理的操作，尝试最后一次同步
    if (this.isOnline && this.pendingSync.size > 0) {
      await this.syncPendingOperations();
    }
    
    // 关闭本地客户端
    await this.localClient.close();
    
    // 如果在线，关闭远程客户端
    if (this.isOnline) {
      try {
        await this.remoteClient.close();
      } catch (error) {
        console.error('远程客户端关闭失败', error);
      }
    }

    this.initialized = false;
  }

  /**
   * 清空数据库
   */
  async clear(): Promise<void> {
    // 清空本地客户端
    await this.localClient.clear();
    
    // 如果在线，清空远程客户端
    if (this.isOnline) {
      try {
        await this.remoteClient.clear();
      } catch (error) {
        console.error('远程客户端清空失败', error);
      }
    }
    
    // 清空待同步操作
    this.pendingSync.clear();
  }

  // 实现 IDatabaseClient 接口的必要方法

  async findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null> {
    const result = await this.localClient.findById(tableName, id);
    return result as T | null;
  }

  async findAll<T extends BaseEntity>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    const result = await this.localClient.findAll(tableName, filter);
    return result as T[];
  }

  async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    const result = await this.localClient.create(tableName, data);
    
    // 根据表名添加到相应的待同步列表
    await this.addToPendingSync(tableName, result as unknown as EntityWithId);
    
    return result as T;
  }

  async update<T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    await this.localClient.update(tableName, id, data);
    
    // 获取完整数据并添加到待同步列表
    const fullData = await this.localClient.findById(tableName, id);
    if (fullData) {
      await this.addToPendingSync(tableName, fullData as unknown as EntityWithId);
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    await this.localClient.delete(tableName, id);
    
    // 添加到待删除同步列表
    await this.addToPendingSync(`deleted${tableName.charAt(0).toUpperCase() + tableName.slice(1)}`, { id });
  }

  async query<T extends BaseEntity>(tableName: string, options: QueryOptions): Promise<QueryResult<T>> {
    const result = await this.localClient.query(tableName, options);
    return {
      data: result.data as T[],
      total: result.total,
      hasMore: result.hasMore
    };
  }

  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    return this.localClient.count(tableName, filter);
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    return this.localClient.executeRawQuery<R>(query, params);
  }

  async beginTransaction(): Promise<void> {
    return this.localClient.beginTransaction();
  }

  async commitTransaction(): Promise<void> {
    return this.localClient.commitTransaction();
  }

  async rollbackTransaction(): Promise<void> {
    return this.localClient.rollbackTransaction();
  }

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return this.localClient.transaction(callback);
  }

  async batch<T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    return this.localClient.batch(tableName, operations);
  }

  // 实现 IDatabaseClient 接口的特定于实体的方法
  async findUsers(query?: any): Promise<User[]> {
    return this.localClient.findUsers(query);
  }

  async findMatches(query?: any): Promise<Match[]> {
    return this.localClient.findMatches(query);
  }

  async findMessages(query?: any): Promise<Message[]> {
    return this.localClient.findMessages(query);
  }

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = await this.localClient.createUser(data);
    await this.addToPendingSync('users', user as unknown as EntityWithId);
    return user;
  }

  async createMatch(data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
    const match = await this.localClient.createMatch(data);
    await this.addToPendingSync('matches', match as unknown as EntityWithId);
    return match;
  }

  async createMessage(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    const message = await this.localClient.createMessage(data);
    await this.addToPendingSync('messages', message as unknown as EntityWithId);
    return message;
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    await this.localClient.updateUser(id, data);
    const user = await this.localClient.findById('users', id);
    if (user) {
      await this.addToPendingSync('users', user as unknown as EntityWithId);
    }
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    await this.localClient.updateMatch(id, data);
    const match = await this.localClient.findById('matches', id);
    if (match) {
      await this.addToPendingSync('matches', match as unknown as EntityWithId);
    }
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    await this.localClient.updateMessage(id, data);
    const message = await this.localClient.findById('messages', id);
    if (message) {
      await this.addToPendingSync('messages', message as unknown as EntityWithId);
    }
  }

  async deleteUser(id: string): Promise<void> {
    await this.localClient.deleteUser(id);
    await this.addToPendingSync('deletedUsers', { id });
  }

  async deleteMatch(id: string): Promise<void> {
    await this.localClient.deleteMatch(id);
    await this.addToPendingSync('deletedMatches', { id });
  }

  async deleteMessage(id: string): Promise<void> {
    await this.localClient.deleteMessage(id);
    await this.addToPendingSync('deletedMessages', { id });
  }

  // 以下是额外的辅助方法，非接口要求但对实现有用的方法
  // 这些方法使用内部接口而不是IDatabaseClient接口

  /**
   * 添加项目到待同步队列
   * @param tableName 表名
   * @param item 待同步的项目
   */
  protected async addToPendingSync(tableName: string, item: EntityWithId): Promise<void> {
    const items = this.pendingSync.get(tableName) || [];
    items.push(item);
    this.pendingSync.set(tableName, items);
  }
}