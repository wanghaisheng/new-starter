import type { IDataService, DataServiceConfig } from '../types';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import type { QueryOptions, QueryResult } from '@/core/lib/db/types/database';

/**
 * MockHybridDatabaseClient: 参考 HybridDatabaseClient 语义的内存 mock 实现。
 * 支持多表 CRUD、批量、元数据、事务、权限、健康检查、同步等。
 */
export class MockHybridDatabaseClient implements IDataService<BaseEntity> {
  private db: Map<string, BaseEntity[]> = new Map();
  private initialized = false;
  private config: DataServiceConfig;

  constructor(config: DataServiceConfig) {
    this.config = config;
  }

  async initialize(config?: DataServiceConfig): Promise<void> {
    this.initialized = true;
  }

  async connect(): Promise<void> {
    this.initialized = true;
  }

  async disconnect(): Promise<void> {
    this.initialized = false;
  }

  async clear(): Promise<void> {
    this.db.clear();
  }

  async reset(): Promise<void> {
    await this.clear();
  }

  async sync(): Promise<void> {
    // mock: 无实际同步
  }

  async beginTransaction(): Promise<void> {}
  async commitTransaction(): Promise<void> {}
  async rollbackTransaction(): Promise<void> {}

  async findOne(tableName: string, id: string): Promise<BaseEntity | null> {
    const table = this.db.get(tableName) || [];
    return table.find(e => e.id === id) || null;
  }

  async findById(tableName: string, id: string): Promise<BaseEntity | null> {
    return this.findOne(tableName, id);
  }

  async query(tableName: string, options: QueryOptions): Promise<QueryResult<BaseEntity>> {
    let rows = [...(this.db.get(tableName) || [])];
    // 简单 where 支持（仅支持 { [key]: value }）
    if (options?.where && typeof options.where === 'object' && !Array.isArray(options.where)) {
      const where = options.where as Record<string, any>;
      rows = rows.filter(row => {
        for (const key in where) {
          if (key === '$and' || key === '$or') continue; // 不支持复合条件
          if (row[key] !== where[key]) return false;
        }
        return true;
      });
    }
    // 分页
    const offset = options?.offset || 0;
    const limit = options?.limit || rows.length;
    const items = rows.slice(offset, offset + limit);
    return { items, total: rows.length };
  }

  async insert(tableName: string, data: BaseEntity): Promise<BaseEntity> {
    let table = this.db.get(tableName);
    if (!table) {
      table = [];
      this.db.set(tableName, table);
    }
    table.push(data);
    return data;
  }

  async create(tableName: string, data: BaseEntity): Promise<BaseEntity> {
    return this.insert(tableName, data);
  }

  async update(tableName: string, id: string, data: Partial<BaseEntity>): Promise<void> {
    const table = this.db.get(tableName) || [];
    const idx = table.findIndex(e => e.id === id);
    if (idx !== -1) {
      table[idx] = { ...table[idx], ...data };
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    const table = this.db.get(tableName) || [];
    const idx = table.findIndex(e => e.id === id);
    if (idx !== -1) {
      table.splice(idx, 1);
    }
  }

  async batch(tableName: string, operations: Array<{ type: 'add' | 'put' | 'insert' | 'update' | 'delete'; data?: BaseEntity | Partial<BaseEntity>; id?: string; }>): Promise<void> {
    for (const op of operations) {
      if (op.type === 'add' || op.type === 'put' || op.type === 'insert') {
        if (op.data) await this.insert(tableName, op.data as BaseEntity);
      } else if (op.type === 'update') {
        if (op.id && op.data) await this.update(tableName, op.id, op.data as Partial<BaseEntity>);
      } else if (op.type === 'delete') {
        if (op.id) await this.delete(tableName, op.id);
      }
    }
  }

  async createMany(tableName: string, data: BaseEntity[]): Promise<BaseEntity[]> {
    for (const entity of data) {
      await this.insert(tableName, entity);
    }
    return data;
  }

  async updateMany(tableName: string, ids: string[], updates: Partial<BaseEntity>): Promise<number> {
    let count = 0;
    for (const id of ids) {
      await this.update(tableName, id, updates);
      count++;
    }
    return count;
  }

  async deleteMany(tableName: string, ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      await this.delete(tableName, id);
      count++;
    }
    return count;
  }

  async findAll(tableName: string, filter?: Record<string, any>): Promise<BaseEntity[]> {
    let rows = [...(this.db.get(tableName) || [])];
    if (filter && typeof filter === 'object') {
      rows = rows.filter(row => {
        for (const key in filter) {
          if (row[key] !== filter[key]) return false;
        }
        return true;
      });
    }
    return rows;
  }

  async count(tableName: string, options?: QueryOptions): Promise<number> {
    const result = await this.query(tableName, options || {});
    return result.total ?? (result.items ? result.items.length : 0);
  }

  async get(key: string): Promise<any> {
    // mock: 仅支持 db 级别的元数据
    if (key === '__tables__') return Array.from(this.db.keys());
    return undefined;
  }

  async set(key: string, value: any): Promise<void> {
    // mock: 不做持久化
  }

  async checkHealth(): Promise<{ healthy: boolean; reason?: string }> {
    return { healthy: true };
  }

  async getMetadata(): Promise<any> {
    // 返回所有表名和数据量
    const meta: Record<string, any> = {};
    for (const [table, rows] of this.db.entries()) {
      meta[table] = { count: rows.length };
    }
    return meta;
  }

  async getStats(): Promise<any> {
    let total = 0;
    for (const rows of this.db.values()) {
      total += rows.length;
    }
    return { totalTables: this.db.size, totalRows: total };
  }

  async hasPermission(action: string, resource: string): Promise<boolean> {
    return true;
  }

  async dispose(): Promise<void> {
    await this.clear();
    this.initialized = false;
  }

  getType(): string {
    return 'mock';
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): DataServiceConfig {
    return this.config;
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    // mock: 不支持原生查询，直接返回空数组
    return [];
  }
}
