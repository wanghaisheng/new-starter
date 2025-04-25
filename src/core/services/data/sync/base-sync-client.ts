import { EventEmitter } from 'events';
import { BaseClient } from '@/core/lib/db/clients/base-client';
import type { DataServiceConfig } from '@/core/services/data/types';
import { SyncStrategy, DataMode } from '@/core/lib/db/types/common';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { getNetworkManager } from '@/core/services/infrastructure/network/registry/network-registry';
import type { NetworkStatus as AppNetworkStatus } from '@/core/services/infrastructure/network/network-manager';
import type { SyncConflictResolver } from './sync-manager';

/**
 * 基础同步客户端（2025增强版）
 * 支持多模式（仅离线/仅在线/混合）、多策略（auto/manual/interval）配置，统一入口。
 * 配置全部来源于 DataServiceConfig，避免冗余。
 */
export abstract class BaseSyncClient {
  protected config: DataServiceConfig;
  protected sourceClient: BaseClient | undefined;
  protected targetClient: BaseClient | undefined;
  protected syncStrategy: SyncStrategy;
  protected dataMode: DataMode;
  protected isOnline: boolean = true;
  protected pendingSync: Map<string, BaseEntity[]> = new Map();
  protected syncInProgress: boolean = false;
  protected syncInterval: NodeJS.Timeout | null = null;
  protected lastSyncTimestamp: number = 0;
  protected eventEmitter: EventEmitter = new EventEmitter();
  protected syncRetryCount: number = 0;
  protected maxSyncRetries: number = 5;
  protected syncRetryDelay: number = 5000;
  protected syncStats: {
    totalSynced: number;
    totalFailed: number;
    lastError?: any;
  } = { totalSynced: 0, totalFailed: 0 };

  /**
   * @param config DataServiceConfig
   * @param sourceClient 数据同步源（如本地离线 client），由工厂注入
   * @param targetClient 数据同步目标（如远端在线 client），由工厂注入
   */
  constructor(config: DataServiceConfig, sourceClient?: BaseClient, targetClient?: BaseClient) {
    this.config = config;
    this.dataMode = (config.mode as DataMode) || DataMode.HYBRID;
    this.syncStrategy = (config.services?.data?.options?.syncStrategy as SyncStrategy) || SyncStrategy.AUTO;
    this.sourceClient = sourceClient;
    this.targetClient = targetClient;
  }

  /**
   * 订阅同步状态变化事件
   * @param listener 监听器函数
   */
  onSyncStatusChange(listener: (status: string) => void): () => void {
    this.eventEmitter.on('syncStatusChange', listener);
    
    // 返回取消订阅的函数
    return () => {
      this.eventEmitter.off('syncStatusChange', listener);
    };
  }

  /**
   * 订阅同步进度事件
   * @param listener 监听器函数
   */
  onSyncProgress(listener: (progress: { synced: number; failed: number }) => void): () => void {
    this.eventEmitter.on('syncProgress', listener);
    
    // 返回取消订阅的函数
    return () => {
      this.eventEmitter.off('syncProgress', listener);
    };
  }

  /**
   * 订阅同步冲突事件
   * @param listener 监听器函数
   */
  onSyncConflict(listener: (conflict: any) => void): () => void {
    this.eventEmitter.on('syncConflict', listener);
    
    // 返回取消订阅的函数
    return () => {
      this.eventEmitter.off('syncConflict', listener);
    };
  }

  /**
   * 触发同步状态变化事件
   */
  protected emitSyncStatusChange() {
    const status: string = this.syncInProgress ? 'syncing' : 
                           this.pendingSync.size > 0 ? 'pending' : 
                           this.syncRetryCount > 0 ? 'failed' : 'completed';
    
    this.eventEmitter.emit('syncStatusChange', status);
  }

  /**
   * 触发同步进度事件
   */
  protected emitSyncProgress() {
    this.eventEmitter.emit('syncProgress', {
      synced: this.syncStats.totalSynced,
      failed: this.syncStats.totalFailed
    });
  }

  /**
   * 触发同步冲突事件
   */
  protected emitSyncConflict(conflict: any) {
    this.eventEmitter.emit('syncConflict', conflict);
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
   * 批量同步多个实体类型
   * @param entityTypes 实体类型数组
   * @param options 可选扩展参数（如冲突解决策略等）
   */
  async syncEntities(entityTypes: string[], options?: { conflictResolver?: SyncConflictResolver }): Promise<void[]> {
    return Promise.all(entityTypes.map(e => this.syncEntity(e, options)));
  }

  /**
   * 同步指定实体类型（如表名）到远程/主数据库
   * @param entityType 实体类型或表名
   * @param options 可选扩展参数（如冲突解决策略等）
   * @returns Promise<void>
   */
  async syncEntity(entityType: string, options?: { conflictResolver?: SyncConflictResolver }): Promise<void> {
    throw new Error('[BaseSyncClient] syncEntity 未实现，请在子类中实现同步逻辑');
  }

  /**
   * 初始化数据库连接
   */
  async initialize(): Promise<void> {
    // 初始化本地客户端
    await this.sourceClient?.initialize();
    
    // 如果在线，初始化远程客户端
    if (this.isOnline) {
      try {
        await this.targetClient?.initialize();
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
    await this.sourceClient?.close();
    
    // 如果在线，关闭远程客户端
    if (this.isOnline) {
      try {
        await this.targetClient?.close();
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
    await this.sourceClient?.clear();
    
    // 如果在线，清空远程客户端
    if (this.isOnline) {
      try {
        await this.targetClient?.clear();
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
  async getSyncStatus(): Promise<string> {
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

  /**
   * 获取同步统计信息
   */
  getSyncStats() {
    return { ...this.syncStats };
  }

  /**
   * 重置同步统计信息
   */
  resetSyncStats() {
    this.syncStats = { totalSynced: 0, totalFailed: 0 };
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
}