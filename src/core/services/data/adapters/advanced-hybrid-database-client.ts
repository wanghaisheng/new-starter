// --- cache-to-cache 多端缓存一致性能力 ---
// 事件结构
import type {
  CacheUpdateEvent,
  DataServiceConfig,
  SyncProgress,
  IMemoryCache,
  IDataServiceEventListenerMap,
  IDataServiceEvent,
} from '../types';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import type { QueryOptions, QueryResult } from '@/core/lib/db/types/database';

import { HybridDatabaseClient } from './hybrid-database-client';
import { SyncManager } from '@/core/services/data/sync/sync-manager';
import { createNetworkManager, NetworkManager } from '@/core/services/infrastructure/network/network-manager';
import type { IDataService } from '../types';
import { extractDatabaseConfig } from '../utils/extractDatabaseConfig';
import { getBestCacheBroadcastAdapter, ICacheBroadcastAdapter } from '../cache/cache-broadcast-adapter';

/**
 * AdvancedHybridDatabaseClient
 * 多级缓存架构说明：
 * 
 * - 1级缓存（memoryCache）：
 *   - 纯内存缓存（如 MemoryClient），极致性能，进程级，适合热数据。
 *   - 由 cache provider 决定（如 memory、localStorage、sessionStorage、redis-cache 等）。
 *   - 允许失效和丢弃，不保证持久化。
 * 
 * - 2级缓存/主离线存储（offlineStore）：
 *   - 持久化本地存储（如 IndexedDB、SQLite、Redis 持久化），断网可用。
 *   - 由 offline provider 决定，**必须保证持久化**。
 *   - 是 SyncManager 的同步对象，所有本地变更、待同步队列都落地在这里。
 * 
 * - 3级存储（onlineClient）：
 *   - 远程数据库（如 Supabase、Firebase、Cloud SQLite、Turso 等），保证全局一致性。
 *   - 由 online provider 决定。
 * 
 * - syncManager 只负责 offlineStore <-> onlineClient 的同步。
 * - networkManager 监听网络状态，自动同步/切换。
 * 
 * 环境变量支持多 provider/orm/cache 策略，详见 adapters/README.md。
 */

export class AdvancedHybridDatabaseClient extends HybridDatabaseClient implements IDataService<BaseEntity> {
  protected memoryCache: IMemoryCache;
  protected offlineStore: IDataService<BaseEntity>; // 必须为 BaseSyncClient，主离线存储
  protected onlineClient: IDataService<BaseEntity>;
  private cacheTTL: number; // ms
  private cacheTimers: Map<string, NodeJS.Timeout> = new Map();
  private syncManager: SyncManager;
  private networkManager: NetworkManager;
  private instanceId: string = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  private cacheBroadcastAdapter: ICacheBroadcastAdapter;
  private cacheUpdateUnsubscribe?: () => void;
  private entityTypes: string[];

  /**
   * 工厂注入所有底层 client，避免适配器自行选择/实例化
   * @param memoryCache  一级内存缓存（MemoryClient），极致性能，进程内
   * @param offlineStore 主离线存储（如 IndexedDB/SQLite/Redis），SyncManager 的同步对象，**必须持久化**
   * @param onlineClient 远程数据库（如 Supabase/Firebase/Cloud SQLite）
   * @param syncManager  同步调度器，client 必须为 offlineStore
   * @param networkManager 网络状态管理器
   * @param cacheTTL     内存缓存失效时间
   * @param entityTypes  需同步的实体类型列表（如 ['users', 'orders']），如未传则自动从 config.services.data.entityTypes 读取
   * @param cacheBroadcastAdapter 缓存广播适配器，可选，默认自动选择最佳适配器
   */
  constructor(
    config: DataServiceConfig,
    memoryCache: IMemoryCache,
    offlineStore: IDataService<BaseEntity>,
    onlineClient: IDataService<BaseEntity>,
    syncManager: SyncManager,
    networkManager: NetworkManager,
    cacheTTL = 10 * 60 * 1000,
    entityTypes?: string[],
    cacheBroadcastAdapter?: ICacheBroadcastAdapter
  ) {
    super(config, offlineStore, onlineClient);
    this.memoryCache = memoryCache;
    this.offlineStore = offlineStore;
    this.onlineClient = onlineClient;
    this.syncManager = syncManager;
    this.networkManager = networkManager;
    this.cacheTTL = cacheTTL;
    this.entityTypes = entityTypes || config.services?.data?.entityTypes || [];
    this.cacheBroadcastAdapter = cacheBroadcastAdapter || getBestCacheBroadcastAdapter();
    this.cacheBroadcastAdapter.onMessage(this.handleCacheUpdate.bind(this));
    // 监听同步进度
    if (typeof this.syncManager === 'object' && this.syncManager) {
      (this.syncManager as any).onProgress = (progress: SyncProgress) => {
        this.emit?.('syncProgress' as any, progress);
      };
    }
  }

  // 处理远程缓存变更事件，可扩展为调试/日志
  private handleCacheUpdate(event: any) {
    // TODO: 这里可以根据 event 结构刷新本地缓存、触发调试日志等
    // console.log('[CacheBroadcast] 收到远程缓存变更事件', event);
  }

  // 缓存变更时主动广播
  private notifyCacheUpdate(event: any) {
    this.cacheBroadcastAdapter.broadcast(event);
  }

  // 广播缓存变更
  private broadcastCacheUpdate(collection: string, id: string, type: 'set' | 'delete', data?: BaseEntity) {
    const event: CacheUpdateEvent<BaseEntity> = {
      collection, id, type, data, origin: this.instanceId, timestamp: Date.now()
    };
    this.notifyCacheUpdate(event);
  }

  // 监听缓存变更（已由 cacheBroadcastAdapter 统一实现，保留兼容接口）
  private listenCacheUpdate(handler: (event: CacheUpdateEvent<BaseEntity>) => void): () => void {
    return this.cacheBroadcastAdapter.onMessage(handler);
  }

  // 多级缓存读
  async findOne(collection: string, id: string): Promise<BaseEntity | null> {
    // 1. 先查内存缓存
    if (this.memoryCache.hasCache(collection, id)) {
      return this.memoryCache.getCache(collection, id) as BaseEntity;
    }
    // 2. 查本地缓存
    const local = await this.offlineStore.findById(collection, id);
    if (local) return local;
    // 3. 查在线数据库
    if (this.onlineClient && typeof this.onlineClient.findById === 'function') {
      return this.onlineClient.findById(collection, id);
    }
    return null;
  }

  // 多级缓存写
  async insert(collection: string, data: BaseEntity): Promise<BaseEntity> {
    const localRes = await this.offlineStore.create(collection, data);
    if (!localRes.id) throw new Error('Entity id is missing after create');
    this.memoryCache.setCache(collection, localRes.id, localRes);
    this.broadcastCacheUpdate(collection, localRes.id, 'set', localRes);
    // 异步同步到在线数据库
    if (this.onlineClient && typeof this.onlineClient.create === 'function') {
      this.onlineClient.create(collection, localRes).catch(() => {});
    }
    return localRes;
  }

  async update(collection: string, id: string, data: Partial<BaseEntity>): Promise<void> {
    // 先更新本地
    await this.offlineStore.update(collection, id, data);
    // 重新获取更新后的实体
    const localRes = await this.offlineStore.findById(collection, id);
    if (localRes) {
      this.memoryCache.setCache(collection, id, localRes);
      this.broadcastCacheUpdate(collection, id, 'set', localRes);
    }
    // 异步同步到在线数据库
    if (this.onlineClient && typeof this.onlineClient.update === 'function') {
      this.onlineClient.update(collection, id, data).catch(() => {});
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    this.invalidateCache(collection, id);
    this.broadcastCacheUpdate(collection, id, 'delete');
    await this.offlineStore.delete(collection, id);
    await this.onlineClient.delete(collection, id);
    this.emit?.('delete' as any, id);
  }

  // 自动失效策略：写操作后立即失效，或定时失效
  invalidateCache(collection: string, id: string) {
    this.memoryCache.setCache(collection, id, undefined);
    const key = `${collection}:${id}`;
    if (this.cacheTimers.has(key)) {
      clearTimeout(this.cacheTimers.get(key)!);
      this.cacheTimers.delete(key);
    }
  }

  // 设置缓存 TTL，到期自动失效
  private setCacheTTL(collection: string, id: string) {
    const key = `${collection}:${id}`;
    if (this.cacheTimers.has(key)) {
      clearTimeout(this.cacheTimers.get(key)!);
    }
    const timer = setTimeout(() => {
      this.memoryCache.setCache(collection, id, undefined);
      this.cacheTimers.delete(key);
      this.emit?.('cacheInvalidated' as any, { collection, id });
    }, this.cacheTTL);
    this.cacheTimers.set(key, timer);
  }

  /**
   * 触发同步（本地缓存 <-> 云端）
   * 可由 UI/业务层主动调用，也可监听网络状态自动触发
   */
  async syncAll() {
    await this.syncManager.sync();
    // 同步后可自动失效相关缓存
    this.clearMemoryCache();
    (this.syncManagerListeners['sync'] || []).forEach(h => h({ status: 'done' }));
    this.emit?.('sync' as any, { status: 'done' });
  }

  // --- IDataService接口兼容实现 ---
  async beginTransaction(): Promise<void> {
    await this.offlineStore.beginTransaction();
    await this.onlineClient.beginTransaction?.();
  }
  async commitTransaction(): Promise<void> {
    await this.offlineStore.commitTransaction();
    await this.onlineClient.commitTransaction?.();
  }
  async rollbackTransaction(): Promise<void> {
    await this.offlineStore.rollbackTransaction();
    await this.onlineClient.rollbackTransaction?.();
  }
  async batch<T = BaseEntity>(collection: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void> {
    await this.offlineStore.batch?.(collection, operations);
    await this.onlineClient.batch?.(collection, operations);
  }
  async executeRawQuery<T = BaseEntity>(query: string, params?: any[]): Promise<T[]> {
    return (await this.offlineStore.executeRawQuery?.<T>(query, params)) ?? [];
  }
  async query(collection: string, options: QueryOptions): Promise<QueryResult<BaseEntity>> {
    // 优先查内存缓存
    // 可按需扩展多级缓存策略
    return this.offlineStore.query(collection, options);
  }
  async clear(): Promise<void> {
    await this.memoryCache.clear?.();
    await this.offlineStore.clear();
    await this.onlineClient.clear?.();
  }
  async disconnect(): Promise<void> {
    await this.memoryCache.disconnect?.();
    await this.offlineStore.disconnect();
    await this.onlineClient.disconnect?.();
  }
  getType(): string {
    return 'advanced-hybrid';
  }
  isInitialized(): boolean {
    return this.offlineStore.isInitialized?.() ?? true;
  }
  getConfig(): DataServiceConfig {
    return (this.offlineStore.getConfig?.() ?? {}) as DataServiceConfig;
  }

  async get(key: string): Promise<any> {
    // 优先内存缓存，再离线，再在线
    // 需传入 collection, id 两个参数
    if (this.memoryCache && typeof this.memoryCache.getCache === 'function') {
      // 假设 key 形如 'collection:id'
      const [collection, id] = key.split(':');
      if (collection && id) {
        const mem = await this.memoryCache.getCache(collection, id);
        if (mem !== undefined) return mem;
      }
    }
    if (typeof this.offlineStore.get === 'function') {
      const value = await this.offlineStore.get(key);
      if (value !== undefined) return value;
    }
    if (typeof this.onlineClient.get === 'function') {
      return await this.onlineClient.get(key);
    }
    return undefined;
  }

  async set(key: string, value: any): Promise<void> {
    // 假设 key 形如 'collection:id'
    if (this.memoryCache && typeof this.memoryCache.setCache === 'function') {
      const [collection, id] = key.split(':');
      if (collection && id) {
        await this.memoryCache.setCache(collection, id, value);
      }
    }
    if (typeof this.offlineStore.set === 'function') {
      await this.offlineStore.set(key, value);
    }
    if (typeof this.onlineClient.set === 'function') {
      await this.onlineClient.set(key, value);
    }
  }

  async findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    // 合并 memoryCache、offlineStore、onlineClient 的结果
    const results: any[][] = [];
    if (this.memoryCache && typeof this.memoryCache.getAllCache === 'function') {
      const memList = await this.memoryCache.getAllCache(tableName);
      if (Array.isArray(memList)) results.push(memList);
    }
    if (typeof this.offlineStore.findAll === 'function') {
      results.push(await this.offlineStore.findAll(tableName, filter));
    }
    if (typeof this.onlineClient.findAll === 'function') {
      results.push(await this.onlineClient.findAll(tableName, filter));
    }
    // 扁平化并去重（以 id 为主）
    const flat = ([] as any[]).concat(...results);
    const seen = new Set();
    return flat.filter(item => {
      const id = (item as any)?.id;
      if (!id || !seen.has(id)) {
        if (id) seen.add(id);
        return true;
      }
      return false;
    });
  }

  async createMany(tableName: string, data: BaseEntity[]): Promise<BaseEntity[]> {
    // 批量写入 memoryCache、offlineStore，异步同步到 onlineClient
    const results: BaseEntity[] = [];
    for (const entity of data) {
      // memoryCache
      if (this.memoryCache && typeof this.memoryCache.setCache === 'function') {
        await this.memoryCache.setCache(tableName, entity.id, entity);
      }
      // offlineStore
      await this.offlineStore.create(tableName, entity);
      results.push(entity);
      // 异步同步到 onlineClient
      if (this.onlineClient && typeof this.onlineClient.create === 'function') {
        this.onlineClient.create(tableName, entity).catch(() => {});
      }
      this.broadcastCacheUpdate?.(tableName, entity.id, 'set', entity);
    }
    return results;
  }

  async updateMany(tableName: string, ids: string[], updates: Partial<BaseEntity>): Promise<number> {
    let count = 0;
    for (const id of ids) {
      // memoryCache
      if (this.memoryCache && typeof this.memoryCache.getCache === 'function') {
        const entity = await this.memoryCache.getCache(tableName, id);
        if (entity) {
          const updated = { ...entity, ...updates };
          await this.memoryCache.setCache(tableName, id, updated);
          this.broadcastCacheUpdate?.(tableName, id, 'set', updated);
        }
      }
      // offlineStore
      await this.offlineStore.update(tableName, id, updates);
      // 异步同步到 onlineClient
      if (this.onlineClient && typeof this.onlineClient.update === 'function') {
        this.onlineClient.update(tableName, id, updates).catch(() => {});
      }
      count++;
    }
    return count;
  }

  async deleteMany(tableName: string, ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      // memoryCache
      if (this.memoryCache && typeof (this.memoryCache as any).removeCache === 'function') {
        await (this.memoryCache as any).removeCache(tableName, id);
        this.broadcastCacheUpdate?.(tableName, id, 'delete');
      }
      // offlineStore
      await this.offlineStore.delete(tableName, id);
      // 异步同步到 onlineClient
      if (this.onlineClient && typeof this.onlineClient.delete === 'function') {
        this.onlineClient.delete(tableName, id).catch(() => {});
      }
      count++;
    }
    return count;
  }

  // 事件监听标准化
  on<E extends keyof IDataServiceEventListenerMap>(event: E, handler: IDataServiceEventListenerMap[E]): () => void {
    const offFns: (() => void)[] = [];
    if (typeof super.on === 'function') {
      offFns.push(super.on(event, handler));
    }
    if (typeof this.memoryCache.on === 'function') {
      offFns.push(this.memoryCache.on(event, handler));
    }
    if (typeof this.offlineStore.on === 'function') {
      offFns.push(this.offlineStore.on(event, handler));
    }
    if (typeof this.onlineClient.on === 'function') {
      offFns.push(this.onlineClient.on(event, handler));
    }
    if (event === 'sync' && typeof this.syncManagerAddListener === 'function') {
      this.syncManagerAddListener('sync', handler);
    }
    return () => { offFns.forEach(fn => fn && fn()); };
  }

  off<E extends keyof IDataServiceEventListenerMap>(event: E, handler: IDataServiceEventListenerMap[E]): void {
    if (typeof super.off === 'function') {
      super.off(event, handler);
    }
    if (typeof this.memoryCache.off === 'function') {
      this.memoryCache.off(event, handler);
    }
    if (typeof this.offlineStore.off === 'function') {
      this.offlineStore.off(event, handler);
    }
    if (typeof this.onlineClient.off === 'function') {
      this.onlineClient.off(event, handler);
    }
    if (event === 'sync' && typeof this.syncManagerRemoveListener === 'function') {
      this.syncManagerRemoveListener('sync', handler);
    }
  }
  // 标准事件机制适配 SyncManager
  private syncManagerListeners: Record<string, Function[]> = {};
  private syncManagerAddListener(event: string, handler: (...args: any[]) => void) {
    if (!this.syncManagerListeners[event]) this.syncManagerListeners[event] = [];
    this.syncManagerListeners[event].push(handler);
  }
  private syncManagerRemoveListener(event: string, handler: (...args: any[]) => void) {
    if (!this.syncManagerListeners[event]) return;
    this.syncManagerListeners[event] = this.syncManagerListeners[event].filter(h => h !== handler);
  }

  public clearMemoryCache() {
    (this.memoryCache as any).cacheClear?.();
  }

  async dispose(): Promise<void> {
    if (this.cacheUpdateUnsubscribe) this.cacheUpdateUnsubscribe();
    this.cacheTimers.forEach(timer => clearTimeout(timer));
    this.cacheTimers.clear();
    await this.memoryCache.dispose?.();
    await this.offlineStore.dispose?.();
    await this.onlineClient.dispose?.();
    await super.dispose?.();
  }

  /**
   * 获取当前实例支持的同步实体类型
   */
  public getEntityTypes(): string[] {
    return this.entityTypes;
  }
}

/**
 * 用法示例：
 * const db = new AdvancedHybridDatabaseClient({ onlineType: 'supabase', entityTypes: ['users', ...] });
 * db.on('syncProgress', (progress) => { ... });
 * // 网络恢复时自动同步，无需手动触发
 */
