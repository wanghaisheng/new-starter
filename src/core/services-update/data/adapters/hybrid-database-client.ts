import { BaseDatabaseClient } from './base-database-client';
import { SqliteDatabaseClient } from './sqlite-database-client';
import { IndexedDBDatabaseClient } from './indexeddb-database-client';
// 若有 CapacitorSqliteClient、SupabaseClient 可引入
// import { CapacitorSqliteClient } from './capacitor-sqlite-client';
// import { SupabaseClient } from './supabase-client';
import type { IDataService, DataServiceConfig } from '../types';
import { extractDatabaseConfig } from '../utils/extractDatabaseConfig';

/**
 * HybridDatabaseClient
 * 支持离线/在线混合存储：
 * - IndexedDB/CapacitorSqlite 作为离线本地存储
 * - Sqlite/Supabase 作为在线云端存储
 * 可根据网络状态、业务策略自动切换或同步
 */
export class HybridDatabaseClient extends BaseDatabaseClient implements IDataService {
  protected offlineClient: IDataService;
  protected onlineClient: IDataService;
  private mode: 'offline' | 'online' = 'offline';
  private config: DataServiceConfig;

  constructor(config: DataServiceConfig) {
    super(config);
    this.config = config;
    // 默认实现：IndexedDB 离线，Sqlite 在线
    this.offlineClient = new IndexedDBDatabaseClient(extractDatabaseConfig(config));
    this.onlineClient = new SqliteDatabaseClient(extractDatabaseConfig(config));
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

  // 根据模式或策略分流
  private getCurrentClient(): IDataService {
    // 可根据网络、用户配置等切换
    return this.mode === 'online' ? this.onlineClient : this.offlineClient;
  }

  async findOne(collection: string, id: string): Promise<any> {
    return this.getCurrentClient().findOne(collection, id);
  }
  async query(collection: string, query?: any): Promise<any[]> {
    return this.getCurrentClient().query(collection, query);
  }
  async insert(collection: string, data: any): Promise<any> {
    return this.getCurrentClient().insert(collection, data);
  }
  async update(collection: string, id: string, data: any): Promise<any> {
    return this.getCurrentClient().update(collection, id, data);
  }
  async delete(collection: string, id: string): Promise<void> {
    return this.getCurrentClient().delete(collection, id);
  }

  // 可扩展：同步、冲突解决等高级能力
  async sync(): Promise<void> {
    // 实现离线数据与在线数据的同步逻辑
  }

  // 支持事件透传
  on(event: string, handler: (...args: any[]) => void) {
    this.offlineClient.on?.(event, handler);
    this.onlineClient.on?.(event, handler);
  }
  off(event: string, handler: (...args: any[]) => void) {
    this.offlineClient.off?.(event, handler);
    this.onlineClient.off?.(event, handler);
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
  async batch<T>(collection: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void> {
    await this.offlineClient.batch?.(collection, operations);
    await this.onlineClient.batch?.(collection, operations);
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
}
