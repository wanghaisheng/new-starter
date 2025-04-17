import { HybridDatabaseClient } from './hybrid-database-client';
import { FakeIndexedDBDatabaseClient } from './fake-indexeddb-database-client';
import { IndexedDBDatabaseClient } from './indexeddb-database-client';
import { SqliteDatabaseClient } from './sqlite-database-client';
import { SupabaseDatabaseClient } from './supabase-database-client';
import { SyncManager } from '@/core/lib/db/sync/sync-manager';
import { createNetworkManager, NetworkManager } from '@/core/lib/network/network-manager';
import type { DataServiceConfig, IDataService } from '../types';
import { extractDatabaseConfig } from '../utils/extractDatabaseConfig';

/**
 * AdvancedHybridDatabaseClient
 * 多级缓存（内存+本地持久化+云端）+ 自动失效策略 + 同步管理器集成
 */
export interface AdvancedDataServiceConfig extends DataServiceConfig {
  onlineType?: 'sqlite' | 'supabase';
  entityTypes?: string[];
}

// 同步进度类型声明
export interface SyncProgress {
  entityType: string;
  current: number;
  total: number;
  percent: number;
}

export class AdvancedHybridDatabaseClient extends HybridDatabaseClient implements IDataService {
  protected memoryCache: FakeIndexedDBDatabaseClient;
  protected localCache: IndexedDBDatabaseClient;
  protected onlineClient: SqliteDatabaseClient | SupabaseDatabaseClient;
  private cacheTTL: number; // ms
  private cacheTimers: Map<string, NodeJS.Timeout> = new Map();
  private syncManager: SyncManager;
  private networkManager: NetworkManager;

  constructor(config: AdvancedDataServiceConfig, cacheTTL = 10 * 60 * 1000) {
    super(extractDatabaseConfig(config));
    this.memoryCache = new FakeIndexedDBDatabaseClient(config);
    this.localCache = new IndexedDBDatabaseClient(config);
    // 支持更多后端：根据 config.onlineType 动态选择
    if (config.onlineType === 'supabase') {
      this.onlineClient = new SupabaseDatabaseClient(config);
    } else {
      this.onlineClient = new SqliteDatabaseClient(config);
    }
    this.cacheTTL = cacheTTL;
    // 网络管理器
    this.networkManager = createNetworkManager();
    // 集成同步管理器，监听网络自动同步
    this.syncManager = new SyncManager({
      client: this.localCache,
      entityTypes: config.entityTypes || [],
      networkManager: this.networkManager,
      autoSyncOnConnect: true, // 网络恢复自动同步
      // 可传 syncIntervalMs 等高级配置
      onProgress: (progress: SyncProgress) => {
        this.emit?.('syncProgress', progress);
      }
    });
    // 可监听同步进度
    this.on('syncProgress', (progress: SyncProgress) => {
      // 业务层可感知同步进度
      // console.log('同步进度', progress);
    });
  }

  // 多级缓存读
  async findOne<T extends { id: string }>(collection: string, id: string): Promise<T | null> {
    // 1. 先查内存缓存
    if (this.memoryCache.hasCache(collection, id)) {
      return this.memoryCache.getCache(collection, id) as T;
    }
    // 2. 查本地缓存
    const local = await this.localCache.findOne<T>(collection, id);
    if (local) return local;
    // 3. 查在线数据库
    if (this.onlineClient && typeof this.onlineClient.findOne === 'function') {
      return this.onlineClient.findOne<T>(collection, id);
    }
    return null;
  }

  // 多级缓存写
  async insert<T extends { id: string }>(collection: string, data: Partial<T>): Promise<T> {
    // 插入到本地和内存缓存
    const localRes = await this.localCache.insert<T>(collection, data);
    this.memoryCache.setCache(collection, localRes.id, localRes);
    // 异步同步到在线数据库
    if (this.onlineClient && typeof this.onlineClient.insert === 'function') {
      this.onlineClient.insert<T>(collection, localRes).catch(() => {});
    }
    return localRes;
  }

  async update<T extends { id: string }>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    const localRes = await this.localCache.update<T>(collection, id, data);
    if (localRes) this.memoryCache.setCache(collection, id, localRes);
    // 异步同步到在线数据库
    if (this.onlineClient && typeof this.onlineClient.update === 'function') {
      this.onlineClient.update<T>(collection, id, data).catch(() => {});
    }
    return localRes;
  }

  async delete(collection: string, id: string): Promise<void> {
    this.invalidateCache(collection, id);
    await this.localCache.delete(collection, id);
    await this.onlineClient.delete(collection, id);
    this.emit?.('delete', id);
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
      this.emit?.('cacheInvalidated', { collection, id });
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
    this.emit?.('sync', { status: 'done' });
  }

  // --- IDataService接口兼容实现 ---
  async beginTransaction(): Promise<void> {
    await this.localCache.beginTransaction();
    await this.onlineClient.beginTransaction?.();
  }
  async commitTransaction(): Promise<void> {
    await this.localCache.commitTransaction();
    await this.onlineClient.commitTransaction?.();
  }
  async rollbackTransaction(): Promise<void> {
    await this.localCache.rollbackTransaction();
    await this.onlineClient.rollbackTransaction?.();
  }
  async batch<T>(collection: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void> {
    await this.localCache.batch(collection, operations);
    await this.onlineClient.batch?.(collection, operations);
  }
  async query(collection: string, query?: any): Promise<any[]> {
    // 优先查内存缓存
    // 可按需扩展多级缓存策略
    return this.localCache.query(collection, query);
  }
  async clear(): Promise<void> {
    await this.memoryCache.clear();
    await this.localCache.clear();
    await this.onlineClient.clear?.();
  }
  async disconnect(): Promise<void> {
    await this.memoryCache.disconnect();
    await this.localCache.disconnect();
    await this.onlineClient.disconnect?.();
  }
  async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> {
    return this.localCache.executeRawQuery?.(query, params) ?? [];
  }
  getType(): string {
    return 'advanced-hybrid';
  }
  isInitialized(): boolean {
    return this.localCache.isInitialized?.() ?? true;
  }
  getConfig(): AdvancedDataServiceConfig {
    return (this.localCache.getConfig?.() ?? {}) as AdvancedDataServiceConfig;
  }

  // 事件监听标准化
  on(event: string, handler: (...args: any[]) => void) {
    super.on?.(event, handler);
    this.memoryCache.on?.(event, handler);
    this.localCache.on?.(event, handler);
    this.onlineClient.on?.(event, handler);
    if (event === 'sync') {
      this.syncManagerAddListener('sync', handler);
    }
  }
  off(event: string, handler: (...args: any[]) => void) {
    super.off?.(event, handler);
    this.memoryCache.off?.(event, handler);
    this.localCache.off?.(event, handler);
    this.onlineClient.off?.(event, handler);
    if (event === 'sync') {
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
    this.cacheTimers.forEach(timer => clearTimeout(timer));
    this.cacheTimers.clear();
    await this.memoryCache.dispose();
    await this.localCache.dispose();
    await this.onlineClient.dispose();
    await super.dispose?.();
  }
}

/**
 * 用法示例：
 * const db = new AdvancedHybridDatabaseClient({ onlineType: 'supabase', entityTypes: ['users', ...] });
 * db.on('syncProgress', (progress) => { ... });
 * // 网络恢复时自动同步，无需手动触发
 */
