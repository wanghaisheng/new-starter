// 移除无用的旧 NetworkService 引入
// import { NetworkService } from '@/core/services/data/network-service';
import { BaseSyncClient } from '@/core/lib/db/clients/sync/base-sync-client';
import { BaseClient } from '@/core/lib/db/clients/base-client';
// import { IDatabaseClient, IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import { HybridDatabaseConfig, SyncConfig, QueryOptions, QueryResult, SyncStrategy, BatchOperation } from '@/core/lib/db/types/database';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { getNetworkManager } from '@/core/services/infrastructure/network/registry/network-registry';
import type { NetworkStatus as AppNetworkStatus } from '@/core/services/infrastructure/network/network-manager';
import { DatabaseError, DatabaseErrorCode } from '@/core/lib/db/types/database-error';
import type { DatabaseLogger } from '@/core/lib/db/types/database-logger';
import { getDatabaseLogger } from '@/core/lib/db/types/database-logger';

// 明确本地 EntityWithId 类型
// 保证 pendingSync 类型兼容 BaseEntity[]
type EntityWithId = BaseEntity & { id: string };

/**
 * 混合数据库客户端
 * 
 * 支持同时使用本地客户端和远程客户端，提供在线/离线数据访问和自动同步功能。
 * 可根据配置的同步策略确定数据存取的优先顺序和同步行为。
 * 
 * @example
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
 */
export class HybridDatabaseClient extends BaseSyncClient {
  protected localClient: BaseClient;
  protected remoteClient: BaseClient;
  protected syncStrategy: SyncStrategy;
  protected initialized: boolean = false;
  protected isOnline: boolean = true;
  // 保证 pendingSync 类型与父类一致
  protected pendingSync: Map<string, BaseEntity[]> = new Map();
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
   * 监听网络状态变化，自动切换 isOnline 并在恢复网络时同步
   */
  protected async setupNetworkListener(): Promise<void> {
    const networkManager = getNetworkManager();
    networkManager.onStatusChange((status: AppNetworkStatus) => {
      this.isOnline = status === 'online' || status === 'limited' || status === 'slow';
      if (this.isOnline && this.pendingSync.size > 0) {
        this.syncPendingOperations();
      }
      // 可根据 proxy/slow/unknown 做进一步降级或提示
    });
  }

  /**
   * 设置定期同步
   * @param intervalMs 同步间隔，单位毫秒
   */
  protected async setupPeriodicSync(intervalMs: number): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.isOnline && this.pendingSync.size > 0 && !this.syncInProgress) {
        await this.syncPendingOperations();
      }
    }, intervalMs);
  }

  /**
   * 同步待处理操作
   * 将本地更改同步到远程服务器
   * @returns 同步是否成功
   */
  protected async syncPendingOperations(): Promise<boolean> {
    if (!this.isOnline || this.syncInProgress) return false;

    this.syncInProgress = true;
    let success = true;
    try {
      const entries = Array.from(this.pendingSync.entries());
      for (const [collection, items] of entries) {
        if (collection.startsWith('deleted')) {
          const tableName = collection.slice(7); // Remove 'deleted' prefix
          for (const item of items) {
            try {
              await this.remoteClient.delete(tableName.toLowerCase(), item.id);
            } catch (error) {
              console.error('同步删除操作失败:', error);
              success = false;
            }
          }
        } else {
          for (const item of items) {
            try {
              await this.remoteClient.update(collection, item.id, item);
            } catch (error) {
              console.error('同步更新操作失败:', error);
              success = false;
            }
          }
        }
      }
      if (success) {
        this.pendingSync.clear();
      }
    } catch (error) {
      console.error('同步操作失败:', error);
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
  protected async syncCollectionItems(collection: string, items: BaseEntity[]): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const failedItems: BaseEntity[] = [];
      
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
    if (this.initialized) return;

    await this.localClient.initialize();
    
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
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.isOnline && this.pendingSync.size > 0) {
      await this.syncPendingOperations();
    }
    
    await this.localClient.close();
    
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
    await this.localClient.clear();
    
    if (this.isOnline) {
      try {
        await this.remoteClient.clear();
      } catch (error) {
        console.error('远程客户端清空失败', error);
      }
    }
    
    this.pendingSync.clear();
  }

  // 实现 IDatabaseClient 接口的必要方法

  async findById(tableName: string, id: string): Promise<BaseEntity | null> {
    this.checkInitialized();
    // 优先本地查找，若无则查远程
    let entity = await this.localClient.findById(tableName, id);
    if (!entity && this.remoteClient) {
      entity = await this.remoteClient.findById(tableName, id);
    }
    return entity;
  }

  async findAll(tableName: string, filter?: Record<string, any>): Promise<BaseEntity[]> {
    this.checkInitialized();
    // 合并本地和远程数据
    const localList = await this.localClient.findAll(tableName, filter);
    let remoteList: BaseEntity[] = [];
    if (this.remoteClient) {
      remoteList = await this.remoteClient.findAll(tableName, filter);
    }
    // 简单去重合并
    const map = new Map<string, BaseEntity>();
    for (const item of [...localList, ...remoteList]) {
      map.set(item.id, item);
    }
    return Array.from(map.values());
  }

  async create(collection: string, data: BaseEntity): Promise<BaseEntity> {
    this.checkInitialized();
    const result = await this.localClient.create(collection, data);
    // 根据表名添加到相应的待同步列表
    await this.addToPendingSync(collection, result);
    return result;
  }

  async update(collection: string, id: string, data: Partial<BaseEntity>): Promise<void> {
    this.checkInitialized();
    await this.localClient.update(collection, id, data);
    // 获取完整数据并添加到待同步列表
    const fullData = await this.localClient.findById(collection, id);
    if (fullData) {
      await this.addToPendingSync(collection, fullData);
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    this.checkInitialized();
    await this.localClient.delete(collection, id);
    // 添加到待删除同步列表
    await this.addToPendingSync(`deleted${collection.charAt(0).toUpperCase() + collection.slice(1)}`, { id });
  }

  async query(collection: string, query: any): Promise<QueryResult<BaseEntity>> {
    this.checkInitialized();
    const result = await this.localClient.query(collection, query);
    return result;
  }

  async count(collection: string, filter?: Record<string, any>): Promise<number> {
    this.checkInitialized();
    return this.localClient.count(collection, filter);
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.checkInitialized();
    return this.localClient.executeRawQuery<R>(query, params);
  }

  async connect(): Promise<void> {
    await this.localClient.connect();
    await this.remoteClient.connect();
  }

  async disconnect(): Promise<void> {
    await this.localClient.disconnect();
    await this.remoteClient.disconnect();
  }

  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    return this.localClient.beginTransaction();
  }

  async commitTransaction(): Promise<void> {
    this.checkInitialized();
    return this.localClient.commitTransaction();
  }

  async rollbackTransaction(): Promise<void> {
    this.checkInitialized();
    return this.localClient.rollbackTransaction();
  }

  async batch(collection: string, operations: BatchOperation<BaseEntity>[]): Promise<void> {
    this.checkInitialized();
    return this.localClient.batch(collection, operations);
  }

  // 以下是额外的辅助方法，非接口要求但对实现有用的方法
  // 这些方法使用内部接口而不是IDatabaseClient接口

  /**
   * 添加项目到待同步队列
   * @param tableName 表名
   * @param item 待同步的项目
   */
  protected async addToPendingSync(collection: string, item: BaseEntity): Promise<void> {
    const items = this.pendingSync.get(collection) || [];
    items.push(item);
    this.pendingSync.set(collection, items);
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new DatabaseError('混合数据库客户端未初始化', 'CLIENT_NOT_INITIALIZED');
    }
  }
}