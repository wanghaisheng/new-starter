import { IDatabaseClient, DatabaseConfig } from '@/core/lib/db/interfaces';
import { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database.types';

/**
 * 纯内存数据库客户端
 */
export class MemoryDatabaseClient implements IDatabaseClient {
  private data: Record<string, Map<string, any>> = {};

  constructor(private config: DatabaseConfig) {}

  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  async initialize(): Promise<void> {}
  async close(): Promise<void> {}
  async clear(): Promise<void> { this.data = {}; }

  async query<T>(collection: string, query: QueryOptions): Promise<QueryResult<T>> {
    const items = Array.from(this.data[collection]?.values() ?? []);
    return { items } as QueryResult<T>;
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    return this.data[collection]?.get(id) ?? null;
  }

  async findAll<T>(collection: string): Promise<T[]> {
    return Array.from(this.data[collection]?.values() ?? []);
  }

  async create<T>(collection: string, data: Partial<T>): Promise<T> {
    if (!this.data[collection]) this.data[collection] = new Map();
    const id = (data as any).id || Math.random().toString(36).slice(2);
    const item = { ...data, id };
    this.data[collection].set(id, item);
    return item as T;
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    if (!this.data[collection] || !this.data[collection].has(id)) throw new Error('Not found');
    const updated = { ...this.data[collection].get(id), ...data };
    this.data[collection].set(id, updated);
    return updated as T;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    return !!this.data[collection]?.delete(id);
  }

  // ...可根据需要扩展更多接口
}
