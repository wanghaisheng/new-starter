import { BaseDatabaseClient } from './base-database-client';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import type { QueryOptions, QueryResult } from '@/core/lib/db/types/database';
import type { IDataService, DataServiceConfig } from '../types';
import { extractDatabaseConfig } from '../utils/extractDatabaseConfig';

/**
 * HybridDatabaseClient
 * 支持离线/在线混合存储：
 * - IndexedDB/CapacitorSqlite 作为离线本地存储
 * - Sqlite/Supabase 作为在线云端存储
 * 可根据网络状态、业务策略自动切换或同步
 */
export class HybridDatabaseClient extends BaseDatabaseClient<BaseEntity> implements IDataService<BaseEntity> {
  protected offlineClient: IDataService<BaseEntity>;
  protected onlineClient: IDataService<BaseEntity>;
  private mode: 'offline' | 'online' = 'offline';
  private config: DataServiceConfig;

  constructor(config: DataServiceConfig, offlineClient: IDataService<BaseEntity>, onlineClient: IDataService<BaseEntity>) {
    super(config);
    this.config = config;
    this.offlineClient = offlineClient;
    this.onlineClient = onlineClient;
    this.mode = 'offline';
  }

  async initialize(config?: DataServiceConfig): Promise<void> {
    await this.offlineClient.initialize(config);
    await this.onlineClient.initialize(config);
    // 可做数据同步、状态检查等
  }

  async connect(): Promise<void> {
    await this.offlineClient.connect();
    await this.onlineClient.connect();
  }

  async disconnect(): Promise<void> {
    await this.offlineClient.disconnect();
    await this.onlineClient.disconnect();
  }

  async clear(): Promise<void> {
    await this.offlineClient.clear();
    await this.onlineClient.clear();
    this.cacheClear();
  }

  private getCurrentClient(): IDataService<BaseEntity> {
    // 可根据网络、用户配置等切换
    return this.mode === 'online' ? this.onlineClient : this.offlineClient;
  }

  async findOne(tableName: string, id: string): Promise<BaseEntity | null> {
    // 保证返回 BaseEntity | null
    const result = await this.getCurrentClient().findOne(tableName, id);
    return result ?? null;
  }

  async query(tableName: string, options: QueryOptions): Promise<QueryResult<BaseEntity>> {
    // 保证返回 QueryResult<BaseEntity> 结构
    const result = await this.getCurrentClient().query(tableName, options);
    if ('items' in result && Array.isArray(result.items)) {
      return result as QueryResult<BaseEntity>;
    }
    // 兼容老实现：直接返回数组时包装
    return { items: Array.isArray(result) ? result : [], total: Array.isArray(result) ? result.length : 0 };
  }

  async insert(tableName: string, data: Partial<BaseEntity>): Promise<BaseEntity> {
    // 保证 insert 返回 BaseEntity
    return this.getCurrentClient().insert(tableName, data);
  }

  async update(tableName: string, id: string, data: Partial<BaseEntity>): Promise<void> {
    // 保证 update 返回 void
    await this.getCurrentClient().update(tableName, id, data);
  }

  async delete(tableName: string, id: string): Promise<void> {
    await this.getCurrentClient().delete(tableName, id);
  }

  /**
   * 事件订阅：类型安全，聚合 offline/onlineClient 的事件监听。
   * 返回取消订阅函数。
   */
  on<E extends import('../types').IDataServiceEvent>(event: E, listener: import('../types').IDataServiceEventListenerMap[E]): () => void {
    const offFns: (() => void)[] = [];
    if (typeof this.offlineClient.on === 'function') {
      offFns.push((this.offlineClient.on as typeof this.on)(event, listener));
    }
    if (typeof this.onlineClient.on === 'function') {
      offFns.push((this.onlineClient.on as typeof this.on)(event, listener));
    }
    return () => { offFns.forEach(fn => fn && fn()); };
  }

  /**
   * 事件取消订阅：类型安全，聚合 offline/onlineClient 的事件移除。
   */
  off<E extends import('../types').IDataServiceEvent>(event: E, listener: import('../types').IDataServiceEventListenerMap[E]): void {
    if (typeof this.offlineClient.off === 'function') {
      (this.offlineClient.off as typeof this.off)(event, listener);
    }
    if (typeof this.onlineClient.off === 'function') {
      (this.onlineClient.off as typeof this.off)(event, listener);
    }
  }

  async dispose(): Promise<void> {
    await this.offlineClient.dispose?.();
    await this.onlineClient.dispose?.();
    this.cacheClear();
  }

  // 可扩展：根据网络或业务策略切换模式
  setMode(mode: 'offline' | 'online') {
    this.mode = mode;
  }

  // --- IDataService接口全量实现 ---
  async beginTransaction(): Promise<void> {
    await this.offlineClient.beginTransaction?.();
    await this.onlineClient.beginTransaction?.();
  }
  async commitTransaction(): Promise<void> {
    await this.offlineClient.commitTransaction?.();
    await this.onlineClient.commitTransaction?.();
  }
  async rollbackTransaction(): Promise<void> {
    await this.offlineClient.rollbackTransaction?.();
    await this.onlineClient.rollbackTransaction?.();
  }
  async batch<T>(tableName: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void> {
    await this.offlineClient.batch?.(tableName, operations);
    await this.onlineClient.batch?.(tableName, operations);
  }
  async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> {
    if (typeof this.onlineClient.executeRawQuery === 'function') {
      return await this.onlineClient.executeRawQuery<T>(query, params);
    }
    return [];
  }
  getType(): string {
    return 'hybrid';
  }
  isInitialized(): boolean {
    return this.offlineClient.isInitialized?.() && this.onlineClient.isInitialized?.();
  }
  getConfig(): DataServiceConfig {
    return this.config;
  }

  async close(): Promise<void> {
    // 可选: 关闭底层 client 连接
    await this.offlineClient.disconnect?.();
    await this.onlineClient.disconnect?.();
  }

  async findById(tableName: string, id: string): Promise<BaseEntity | null> {
    return this.findOne(tableName, id);
  }

  async findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    // 合并离线和在线数据，去重
    const results: any[][] = [];
    if (typeof this.offlineClient.findAll === 'function') {
      results.push(await this.offlineClient.findAll(tableName, filter));
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

  async create(tableName: string, data: Partial<BaseEntity>): Promise<BaseEntity> {
    return this.insert(tableName, data);
  }

  async count(tableName: string, options?: QueryOptions): Promise<number> {
    const result = await this.query(tableName, options || {});
    return result.total ?? (result.items ? result.items.length : 0);
  }

  async get(key: string): Promise<any> {
    // 优先离线，再在线
    if (typeof this.offlineClient.get === 'function') {
      const value = await this.offlineClient.get(key);
      if (value !== undefined) return value;
    }
    if (typeof this.onlineClient.get === 'function') {
      return await this.onlineClient.get(key);
    }
    return undefined;
  }

  async set(key: string, value: any): Promise<void> {
    if (typeof this.offlineClient.set === 'function') {
      await this.offlineClient.set(key, value);
    }
    if (typeof this.onlineClient.set === 'function') {
      await this.onlineClient.set(key, value);
    }
  }

  /**
   * 健康检查：分别聚合 offline/onlineClient 的健康状态。
   * - offline/online 任意一端 unhealthy 即 unhealthy。
   * - 若未实现 checkHealth，默认 healthy。
   */
  async checkHealth(): Promise<{ healthy: boolean; reason?: string }> {
    const offline = typeof this.offlineClient.checkHealth === 'function'
      ? await this.offlineClient.checkHealth()
      : { healthy: true };
    const online = typeof this.onlineClient.checkHealth === 'function'
      ? await this.onlineClient.checkHealth()
      : { healthy: true };
    if (!offline.healthy) return { healthy: false, reason: 'offline: ' + (offline.reason || 'unknown') };
    if (!online.healthy) return { healthy: false, reason: 'online: ' + (online.reason || 'unknown') };
    return { healthy: true };
  }

  /**
   * 软重置：分别调用 offline/onlineClient 的 reset，并清理自身缓存。
   * - 若未实现 reset，忽略。
   */
  async reset(): Promise<void> {
    if (typeof this.offlineClient.reset === 'function') await this.offlineClient.reset();
    if (typeof this.onlineClient.reset === 'function') await this.onlineClient.reset();
    this.cacheClear?.();
  }

  /**
   * 同步：分别调用 offline/onlineClient 的 sync。
   * - 仅简单聚合，不处理冲突/进度/全局一致性。
   * - 高级同步建议在 AdvancedHybridDatabaseClient 实现。
   */
  async sync(): Promise<void> {
    if (typeof this.offlineClient.sync === 'function') await this.offlineClient.sync();
    if (typeof this.onlineClient.sync === 'function') await this.onlineClient.sync();
  }

  /**
   * 获取元数据：聚合 offline/onlineClient 的 getMetadata。
   * - 返回 { offline, online }。
   */
  async getMetadata(): Promise<any> {
    const offlineMeta = typeof this.offlineClient.getMetadata === 'function'
      ? await this.offlineClient.getMetadata()
      : null;
    const onlineMeta = typeof this.onlineClient.getMetadata === 'function'
      ? await this.onlineClient.getMetadata()
      : null;
    return { offline: offlineMeta, online: onlineMeta };
  }

  /**
   * 获取运行状态统计：聚合 offline/onlineClient 的 getStats。
   * - 返回 { offline, online }。
   */
  async getStats(): Promise<any> {
    const offlineStats = typeof this.offlineClient.getStats === 'function'
      ? await this.offlineClient.getStats()
      : null;
    const onlineStats = typeof this.onlineClient.getStats === 'function'
      ? await this.onlineClient.getStats()
      : null;
    return { offline: offlineStats, online: onlineStats };
  }

  async hasPermission(action: string, resource: string): Promise<boolean> {
    const offline = typeof this.offlineClient.hasPermission === 'function'
      ? await this.offlineClient.hasPermission(action, resource)
      : true;
    const online = typeof this.onlineClient.hasPermission === 'function'
      ? await this.onlineClient.hasPermission(action, resource)
      : true;
    return offline && online;
  }
}
