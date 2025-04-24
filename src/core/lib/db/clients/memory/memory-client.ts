import { BaseClient } from '@/core/lib/db/clients/base-client';
import { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { getDatabaseLogger } from '@/core/lib/db/types/database-logger';

/**
 * 纯内存数据库客户端
 * 严格实现 BaseClient 规范
 */
export class MemoryClient extends BaseClient {
  private data: Record<string, Map<string, any>> = {};

  constructor() {
    super();
    this.logger = getDatabaseLogger('MemoryClient'); // 由父类 protected 管理
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    this.logger.info('MemoryClient initialized');
  }
  async close(): Promise<void> {
    this.data = {};
    this.initialized = false;
    this.logger.info('MemoryClient closed');
  }
  async clear(): Promise<void> {
    this.data = {};
    this.logger.info('MemoryClient cleared');
  }

  async findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    const table = this.data[tableName];
    const item = table?.get(id) ?? null;
    this.logger.debug(`findById in ${tableName}`, { id, found: !!item });
    return item;
  }

  async findAll(tableName: string, filter?: Record<string, any>): Promise<BaseEntity[]> {
    this.checkInitialized();
    const table = this.data[tableName];
    let items = Array.from(table?.values() ?? []);
    if (filter) {
      items = items.filter(item => Object.entries(filter).every(([k, v]) => item[k] === v));
    }
    this.logger.debug(`findAll in ${tableName}`, { count: items.length });
    return items;
  }

  async create(tableName: string, data: BaseEntity): Promise<BaseEntity> {
    this.checkInitialized();
    if (!this.data[tableName]) this.data[tableName] = new Map();
    const id = data.id || Math.random().toString(36).slice(2);
    const item = { ...data, id };
    this.data[tableName].set(id, item);
    this.logger.info(`create in ${tableName}`, { id });
    return item;
  }

  async update(tableName: string, id: string, data: Partial<BaseEntity>): Promise<void> {
    this.checkInitialized();
    const table = this.data[tableName];
    if (!table || !table.has(id)) throw new Error('Not found');
    const updated = { ...table.get(id), ...data };
    table.set(id, updated);
    this.logger.info(`update in ${tableName}`, { id });
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    this.data[tableName]?.delete(id);
    this.logger.info(`delete in ${tableName}`, { id });
  }

  async query(tableName: string, options: QueryOptions): Promise<QueryResult<BaseEntity>> {
    this.checkInitialized();
    const table = this.data[tableName];
    let items = Array.from(table?.values() ?? []);
    if (options.where) {
      items = items.filter(item => Object.entries(options.where!).every(([k, v]) => item[k] === v));
    }
    // 支持分页
    const total = items.length;
    if (options.offset !== undefined || options.limit !== undefined) {
      const start = options.offset || 0;
      const end = options.limit !== undefined ? start + options.limit : undefined;
      items = items.slice(start, end);
    }
    this.logger.debug(`query in ${tableName}`, { total, returned: items.length });
    return { items, total };
  }

  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    this.checkInitialized();
    const items = await this.findAll(tableName, filter);
    this.logger.debug(`count in ${tableName}`, { count: items.length });
    return items.length;
  }

  async beginTransaction(): Promise<void> {
    this.transactionActive = true;
    this.logger.info('Transaction started');
  }
  async commitTransaction(): Promise<void> {
    this.transactionActive = false;
    this.logger.info('Transaction committed');
  }
  async rollbackTransaction(): Promise<void> {
    this.transactionActive = false;
    this.logger.warn('Transaction rolled back');
  }

  async batch(tableName: string, operations: BatchOperation<BaseEntity>[]): Promise<void> {
    this.checkInitialized();
    for (const op of operations) {
      switch (op.type) {
        case 'add':
        case 'put':
          await this.create(tableName, op.data);
          break;
        case 'update':
          if (!('id' in op)) throw new Error('Batch update operation missing id');
          await this.update(tableName, (op as any).id, op.data);
          break;
        case 'delete':
          if (!('id' in op)) throw new Error('Batch delete operation missing id');
          await this.delete(tableName, (op as any).id);
          break;
      }
    }
    this.logger.info('Batch operation completed', { tableName, count: operations.length });
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.logger.warn('executeRawQuery is not supported in MemoryClient');
    return [];
  }

  protected checkInitialized(): void {
    if (!this.initialized) throw new Error('MemoryClient not initialized');
  }
}
