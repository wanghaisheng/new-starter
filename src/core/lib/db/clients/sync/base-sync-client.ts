import { EventEmitter } from 'events';
import { IDatabaseClient, SyncConfig, SyncStrategy, SyncStatus } from '@/core/lib/db/interfaces';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { getNetworkManager } from '@/core/services/infrastructure/network/registry/network-registry';
import type { NetworkStatus as AppNetworkStatus } from '@/core/services/infrastructure/network/network-manager';

/**
 * 基础同步客户端
 * 提供通用的离线/在线数据同步功能
 */
export abstract class BaseSyncClient {
  protected localClient: IDatabaseClient;
  protected remoteClient: IDatabaseClient;
  protected syncStrategy: SyncStrategy;
  protected isOnline: boolean = true;
  protected pendingSync: Map<string, BaseEntity[]> = new Map();
  protected syncInProgress: boolean = false;
  protected syncInterval: NodeJS.Timeout | null = null;
  protected lastSyncTimestamp: number = 0;
  protected eventEmitter: EventEmitter = new EventEmitter();
  protected syncRetryCount: number = 0;
  protected maxSyncRetries: number = 5;
  protected syncRetryDelay: number = 5000; // 5秒后重试

  constructor(config: SyncConfig) {
    this.localClient = config.localClient;
    this.remoteClient = config.remoteClient;
    this.syncStrategy = config.strategy || 'offline-first';
    
    // 设置最大重试次数（如果配置中提供）
    if (config.maxSyncRetries !== undefined) {
      this.maxSyncRetries = config.maxSyncRetries;
    }
    
    // 设置重试延迟（如果配置中提供）
    if (config.syncRetryDelayMs !== undefined) {
      this.syncRetryDelay = config.syncRetryDelayMs;
    }
    
    // 监听网络状态变化
    this.setupNetworkListener();
    
    // 设置定期同步
    this.setupPeriodicSync(config.syncIntervalMs || 60000); // 默认每分钟同步一次
  }

  /**
   * 订阅同步状态变化事件
   * @param listener 监听器函数
   */
  onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.eventEmitter.on('syncStatusChange', listener);
    
    // 返回取消订阅的函数
    return () => {
      this.eventEmitter.off('syncStatusChange', listener);
    };
  }

  /**
   * 触发同步状态变化事件
   */
  protected emitSyncStatusChange() {
    const status: SyncStatus = this.syncInProgress ? 'syncing' : 
                              this.pendingSync.size > 0 ? 'pending' : 
                              this.syncRetryCount > 0 ? 'failed' : 'completed';
    
    this.eventEmitter.emit('syncStatusChange', status);
  }

  /**
   * 获取待同步的总变更数
   */
  protected getTotalPendingChanges(): number {
    let total = 0;
    for (const items of Array.from(this.pendingSync.values())) {
      total += items.length;
    }
    return total;
  }

  /**
   * 设置网络监听器
   */
  protected setupNetworkListener() {
    // 统一使用 NetworkManager 监听多状态
    const networkManager = getNetworkManager();
    networkManager.onStatusChange((status: AppNetworkStatus) => {
      const wasOnline = this.isOnline;
      this.isOnline = status === 'online' || status === 'limited' || status === 'slow';
      // 离线->在线/弱网/慢速，尝试同步
      if (!wasOnline && this.isOnline) {
        this.syncRetryCount = 0;
        this.syncPendingOperations();
        this.emitSyncStatusChange();
      } else if (!this.isOnline) {
        // 非可用网络下也通知状态变化
        this.emitSyncStatusChange();
      }
      // 可扩展更多状态下的降级/提示逻辑
      if (status === 'proxy') {
        // 代理下可提示或降级
      } else if (status === 'slow') {
        // 慢速下可降级同步批次、延迟等
      }
    });
  }

  /**
   * 设置定期同步
   */
  protected setupPeriodicSync(intervalMs: number) {
    // 清除现有的同步间隔
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // 设置新的同步间隔
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.pendingSync.size > 0) {
        // 重置重试计数
        this.syncRetryCount = 0;
        this.syncPendingOperations();
      }
    }, intervalMs);
  }

  /**
   * 手动触发同步
   * 可用于UI中的"立即同步"按钮
   */
  async manualSync(): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }
    
    if (this.syncInProgress) {
      return false;
    }
    
    if (this.pendingSync.size === 0) {
      // 没有待同步的数据，但仍然更新同步时间戳
      this.lastSyncTimestamp = Date.now();
      this.emitSyncStatusChange();
      return true;
    }
    
    // 重置重试计数
    this.syncRetryCount = 0;
    return this.syncPendingOperations();
  }

  /**
   * 同步待处理操作
   * 子类可以覆盖此方法以实现特定的同步逻辑
   */
  protected async syncPendingOperations(): Promise<boolean> {
    if (!this.isOnline || this.syncInProgress || this.pendingSync.size === 0) return false;
    
    this.syncInProgress = true;
    this.emitSyncStatusChange();
    
    try {
      // 同步所有待处理的操作
      for (const [collection, items] of Array.from(this.pendingSync.entries())) {
        await this.syncCollectionItems(collection, items);
      }
      
      // 更新最后同步时间戳
      this.lastSyncTimestamp = Date.now();
      this.syncRetryCount = 0;
      this.emitSyncStatusChange();
      
      return true;
    } catch (error) {
      console.error('同步操作过程中发生错误', error);
      
      // 增加重试计数
      this.syncRetryCount++;
      
      // 如果未达到最大重试次数，则安排重试
      if (this.syncRetryCount < this.maxSyncRetries) {
        setTimeout(() => {
          this.syncInProgress = false;
          this.syncPendingOperations();
        }, this.syncRetryDelay);
      } else {
        // 重置重试计数，放弃当前同步尝试
        this.syncRetryCount = 0;
        this.syncInProgress = false;
        this.emitSyncStatusChange();
      }
      
      return false;
    } finally {
      if (this.syncRetryCount === 0) {
        this.syncInProgress = false;
        this.emitSyncStatusChange();
      }
    }
  }

  /**
   * 同步特定集合的项目
   * 子类必须实现此方法以处理特定类型的数据同步
   */
  protected abstract syncCollectionItems(collection: string, items: BaseEntity[]): Promise<void>;

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<void> {
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
    
    // 通知状态变化
    this.emitSyncStatusChange();
  }

  /**
   * 关闭数据库连接
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
    
    // 清空待同步队列
    this.pendingSync.clear();
    this.lastSyncTimestamp = 0;
    this.emitSyncStatusChange();
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<SyncStatus> {
    return this.syncInProgress ? 'syncing' : 
           this.pendingSync.size > 0 ? 'pending' : 
           this.syncRetryCount > 0 ? 'failed' : 'completed';
  }

  /**
   * 获取最后同步时间戳
   */
  async getLastSyncTimestamp(): Promise<number> {
    return this.lastSyncTimestamp;
  }

  /**
   * 添加项目到待同步队列
   */
  protected async addToPendingSync(collection: string, item: BaseEntity) {
    if (!this.pendingSync.has(collection)) {
      this.pendingSync.set(collection, []);
    }
    
    this.pendingSync.get(collection)?.push(item);
    this.emitSyncStatusChange();
  }
}