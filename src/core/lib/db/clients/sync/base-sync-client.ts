import { IDatabaseClient, SyncConfig, SyncStrategy, SyncStatus } from '../../interfaces';
import { NetworkService } from '@/core/services/network-service';
import { EventEmitter } from 'events';

/**
 * 基础同步客户端
 * 提供通用的离线/在线数据同步功能
 */
export abstract class BaseSyncClient {
  protected localClient: IDatabaseClient;
  protected remoteClient: IDatabaseClient;
  protected syncStrategy: SyncStrategy;
  protected isOnline: boolean = true;
  protected pendingSync: Map<string, any[]> = new Map();
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
    this.syncStrategy = config.syncStrategy || 'offline-first';
    
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
    const status: SyncStatus = {
      lastSyncTimestamp: this.lastSyncTimestamp,
      pendingChanges: this.getTotalPendingChanges(),
      isSyncing: this.syncInProgress,
    };
    
    this.eventEmitter.emit('syncStatusChange', status);
  }

  /**
   * 获取待同步的总变更数
   */
  protected getTotalPendingChanges(): number {
    let total = 0;
    for (const items of this.pendingSync.values()) {
      total += items.length;
    }
    return total;
  }

  /**
   * 设置网络监听器
   */
  protected setupNetworkListener() {
    // 使用网络服务监听网络状态变化
    const networkService = NetworkService.getInstance();
    networkService.onNetworkStatusChange((status) => {
      const wasOffline = !this.isOnline;
      this.isOnline = status.connected;
      
      // 如果从离线变为在线，尝试同步待处理的操作
      if (wasOffline && this.isOnline) {
        // 重置重试计数
        this.syncRetryCount = 0;
        this.syncPendingOperations();
        
        // 通知状态变化
        this.emitSyncStatusChange();
      } else if (!this.isOnline) {
        // 离线状态下也通知状态变化
        this.emitSyncStatusChange();
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
      for (const [collection, items] of this.pendingSync.entries()) {
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
  protected abstract syncCollectionItems(collection: string, items: any[]): Promise<void>;

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
    
    // 清空待同步操作
    this.pendingSync.clear();
    
    // 通知状态变化
    this.emitSyncStatusChange();
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus(): Promise<SyncStatus> {
    return {
      lastSyncTimestamp: this.lastSyncTimestamp,
      pendingChanges: this.getTotalPendingChanges(),
      isSyncing: this.syncInProgress
    };
  }

  /**
   * 获取最后同步时间戳
   */
  async getLastSyncTimestamp(): Promise<number> {
    return this.lastSyncTimestamp;
  }

  /**
   * 添加项目到待同步列表
   */
  protected addToPendingSync(collection: string, item: any) {
    if (!this.pendingSync.has(collection)) {
      this.pendingSync.set(collection, []);
    }
    
    // 检查是否已存在相同ID的项目，如果存在则更新
    const items = this.pendingSync.get(collection)!;
    const existingIndex = items.findIndex(existing => existing.id === item.id);
    
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }
    
    // 通知状态变化
    this.emitSyncStatusChange();
  }
}