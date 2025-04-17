// FakeIndexedDBDatabaseClient: 可用作纯内存 IndexedDB mock，也可作为高性能缓存层
import { BaseDatabaseClient } from './base-database-client';
import type { IDataService, DataServiceConfig } from '../types';

/**
 * FakeIndexedDBDatabaseClient
 * 1. 纯内存模拟 IndexedDB，适用于测试、mock 环境
 * 2. 可作为 Hybrid/主服务的缓存层，提升读写性能
 */
export class FakeIndexedDBDatabaseClient extends BaseDatabaseClient implements IDataService {
  private store: Record<string, Record<string, any>> = {};
  private config: DataServiceConfig;

  constructor(config: DataServiceConfig) {
    super(config);
    this.config = config;
  }

  async initialize(): Promise<void> {
    // 无需实际初始化
  }

  async connect(): Promise<void> {
    // 无需实际连接
  }

  async disconnect(): Promise<void> {
    // 清空所有内存数据
    this.store = {};
    this.cacheClear();
  }

  async clear(): Promise<void> {
    this.store = {};
    this.cacheClear();
  }

  async findOne(collection: string, id: string): Promise<any> {
    return this.store[collection]?.[id] ?? null;
  }

  async query(collection: string, query?: any): Promise<any[]> {
    const all = Object.values(this.store[collection] || {});
    // 简单支持按属性等值过滤
    if (query && typeof query === 'object') {
      return all.filter(item => Object.entries(query).every(([k, v]) => item[k] === v));
    }
    return all;
  }

  async insert<T extends { id: string }>(collection: string, data: Partial<T>): Promise<T> {
    const id = (data as any).id || Math.random().toString(36).slice(2);
    const entity = { ...data, id } as T;
    if (!this.store[collection]) this.store[collection] = {};
    this.store[collection][id] = entity;
    this.cacheInvalidate(`${collection}:${id}`);
    this.emit?.('insert', entity);
    return entity;
  }

  async update<T extends { id: string }>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
    if (!this.store[collection] || !this.store[collection][id]) return null;
    this.store[collection][id] = { ...this.store[collection][id], ...data };
    this.cacheInvalidate(`${collection}:${id}`);
    this.emit?.('update', this.store[collection][id]);
    return this.store[collection][id];
  }

  async delete(collection: string, id: string): Promise<void> {
    if (this.store[collection]) delete this.store[collection][id];
    this.cacheInvalidate(`${collection}:${id}`);
    this.emit?.('delete', id);
  }

  // IDataService接口兼容方法补全
  async beginTransaction(): Promise<void> {}
  async commitTransaction(): Promise<void> {}
  async rollbackTransaction(): Promise<void> {}
  async batch<T>(collection: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void> {}
  async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> { return []; }
  getType(): string { return 'fake-indexeddb'; }
  isInitialized(): boolean { return true; }
  getConfig(): any { return {}; }

  // 可选：实现缓存接口（如 get/set/has），便于作为高性能缓存层复用
  getCache(collection: string, id: string): any {
    return this.store[collection]?.[id];
  }
  setCache(collection: string, id: string, data: any): void {
    if (!this.store[collection]) this.store[collection] = {};
    this.store[collection][id] = data;
  }
  hasCache(collection: string, id: string): boolean {
    return !!this.store[collection]?.[id];
  }

  async dispose(): Promise<void> {
    this.store = {};
    this.cacheClear();
  }
}

// 用法：
// 1. 作为 mock 数据库（测试/开发环境）
//    new FakeIndexedDBDatabaseClient(config)
// 2. 作为缓存层（Hybrid/主服务组合）
//    可通过 hasCache/getCache/setCache 实现本地优先缓存、内存加速等高级场景