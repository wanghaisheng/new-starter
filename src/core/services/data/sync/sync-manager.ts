import type { BaseSyncClient } from '@/core/services/data/sync/base-sync-client';
import type { NetworkManager } from '@/core/services/infrastructure/network/network-manager';
import type { ICacheBroadcastAdapter } from '@/core/services/data/cache/cache-broadcast-adapter';
import { getBestCacheBroadcastAdapter } from '@/core/services/data/cache/cache-broadcast-adapter';

export interface SyncConflictContext {
  collection: string;
  local: any;
  remote: any;
  meta?: any;
}

export type SyncConflictResolver = (ctx: SyncConflictContext) => any | Promise<any>;
export type SyncPriorityFn = (collection: string, entityTypes: string[]) => string[];

export interface SyncManagerOptions {
  client: BaseSyncClient;
  entityTypes?: string[];
  networkManager: NetworkManager;
  autoSyncOnConnect?: boolean;
  syncIntervalMs?: number;
  conflictResolver?: SyncConflictResolver;
  syncPriorityFn?: SyncPriorityFn;
  cacheBroadcastAdapter?: ICacheBroadcastAdapter;
}

/**
 * 数据同步管理器（2025增强版）
 * 
 * 推荐所有自定义同步/冲突策略均通过 SyncManagerOptions 注入，避免硬编码，便于测试和多端适配：
 *
 * 示例：
 * const syncManager = new SyncManager({
 *   client: mySyncClient,
 *   entityTypes: ['users', 'orders'],
 *   conflictResolver: (ctx) => { ... }, // 注入自定义冲突解决逻辑
 *   syncPriorityFn: (collection, allTypes) => { ... }, // 注入自定义同步优先级/批量策略
 * });
 *
 * 这样可灵活实现本地优先、远端优先、字段级合并、重要表优先等多种同步/冲突策略，且便于 mock 测试与多端环境适配。
 *
 * ⚠️ 不建议在 SyncManager/SyncClient 内部硬编码具体策略，所有业务相关同步/冲突逻辑均应通过 options 注入。
 */
export class SyncManager {
  private client: BaseSyncClient;
  private entityTypes: string[];
  private networkManager: NetworkManager;
  private autoSyncOnConnect: boolean;
  private syncIntervalMs: number;
  private syncTimer: NodeJS.Timeout | null = null;
  private statusHandler?: (status: import('@/core/services/infrastructure/network/network-manager').NetworkStatus) => void;
  // 新增：事件监听句柄
  private unsubscribeProgress?: () => void;
  private unsubscribeConflict?: () => void;
  private conflictResolver?: SyncConflictResolver;
  private syncPriorityFn?: SyncPriorityFn;
  private cacheBroadcastAdapter: ICacheBroadcastAdapter;

  constructor(options: SyncManagerOptions) {
    this.client = options.client;
    this.entityTypes = options.entityTypes || [];
    this.networkManager = options.networkManager;
    this.autoSyncOnConnect = options.autoSyncOnConnect ?? true;
    this.syncIntervalMs = options.syncIntervalMs || 10 * 60 * 1000;
    this.conflictResolver = options.conflictResolver;
    this.syncPriorityFn = options.syncPriorityFn;
    this.cacheBroadcastAdapter = options.cacheBroadcastAdapter || getBestCacheBroadcastAdapter();
    this.cacheBroadcastAdapter.onMessage(this.handleCacheUpdate.bind(this));
  }

  /** 启动定时同步与事件监听 */
  start() {
    if (this.syncTimer) return;
    this.syncTimer = setInterval(() => this.sync(), this.syncIntervalMs);
    if (this.autoSyncOnConnect) {
      this.sync();
    }
    this.statusHandler = (status) => {
      if (this.autoSyncOnConnect && (status === 'online' || status === 'limited' || status === 'slow')) {
        this.sync();
      }
    };
    this.networkManager.onStatusChange(this.statusHandler);
    // 监听同步进度与冲突（如有能力）
    if (typeof this.client.onSyncProgress === 'function') {
      this.unsubscribeProgress = this.client.onSyncProgress(progress => {
        // 可扩展：上报进度到 UI/日志/监控
      });
    }
    if (typeof this.client.onSyncConflict === 'function') {
      this.unsubscribeConflict = this.client.onSyncConflict(conflict => {
        // 可扩展：上报冲突到 UI/日志/监控
      });
    }
  }

  /** 停止定时同步与事件监听 */
  stop() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.statusHandler) {
      this.networkManager.offStatusChange(this.statusHandler);
      this.statusHandler = undefined;
    }
    if (this.unsubscribeProgress) {
      this.unsubscribeProgress();
      this.unsubscribeProgress = undefined;
    }
    if (this.unsubscribeConflict) {
      this.unsubscribeConflict();
      this.unsubscribeConflict = undefined;
    }
  }

  /** 执行一次同步（支持统计、优先级、冲突处理） */
  async sync() {
    if (!this.networkManager.isConnected()) {
      return;
    }
    try {
      // 支持同步优先级
      let entityTypes = this.entityTypes;
      if (this.syncPriorityFn) {
        entityTypes = this.syncPriorityFn('', this.entityTypes);
      }
      if (typeof this.client.syncEntities === 'function') {
        await this.client.syncEntities(entityTypes, {
          conflictResolver: this.conflictResolver
        });
      } else {
        for (const entityType of entityTypes) {
          if (typeof this.client.syncEntity === 'function') {
            await this.client.syncEntity(entityType, {
              conflictResolver: this.conflictResolver
            });
          }
        }
      }
      if (typeof this.client.getSyncStats === 'function') {
        const stats = this.client.getSyncStats();
        // 可扩展：输出或上报同步统计
      }
    } catch (error) {
      console.error(`[SyncManager] 批量同步失败:`, error);
    }
  }

  /**
   * 主动/定期将 memoryCache 数据刷新到 offlineStore
   * 需由 AdvancedHybridDatabaseClient 注入 memoryCache、offlineStore 实例
   * 支持批量 flush，确保数据持久化，防止数据丢失
   */
  async flushMemoryToOffline() {
    const memoryCache = (this.client as any).memoryCache;
    const offlineStore = (this.client as any).offlineStore;
    if (!memoryCache || !offlineStore) {
      console.warn('[SyncManager] flushMemoryToOffline: memoryCache 或 offlineStore 未注入');
      return;
    }
    if (typeof memoryCache.getAllCache === 'function') {
      const allCache = await memoryCache.getAllCache(); // { [collection]: { [id]: data } }
      for (const collection in allCache) {
        const items = allCache[collection];
        const operations = Object.keys(items).map(id => ({
          type: 'insert',
          data: items[id],
          id
        }));
        if (operations.length > 0 && typeof offlineStore.batch === 'function') {
          await offlineStore.batch(collection, operations);
        }
      }
      // flush 后可清空 memoryCache（如需）
      if (typeof memoryCache.clear === 'function') {
        await memoryCache.clear();
      }
      console.info('[SyncManager] flushMemoryToOffline: 已刷新全部 memoryCache 至 offlineStore');
    } else {
      console.warn('[SyncManager] flushMemoryToOffline: memoryCache 未实现 getAllCache');
    }
  }

  // 处理远程缓存变更事件，可扩展为调试/日志
  private handleCacheUpdate(event: any) {
    // TODO: 这里可以根据 event 结构刷新本地缓存、触发调试日志等
    // console.log('[SyncManager][CacheBroadcast] 收到远程缓存变更事件', event);
  }

  // 缓存变更时主动广播
  public notifyCacheUpdate(event: any) {
    this.cacheBroadcastAdapter.broadcast(event);
    // console.log('[SyncManager][CacheBroadcast] 广播本地缓存变更事件', event);
  }

  async dispose(): Promise<void> {
    this.cacheBroadcastAdapter?.close?.(); // 释放资源
    this.stop();
  }
}
