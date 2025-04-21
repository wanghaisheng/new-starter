// 一个简单的 HybridDatabaseClient mock 实现，支持 query/insert
// 并补全 IDataService 所有接口方法，保证测试环境类型安全和运行安全
import { IDataService } from '../types';

export class MockHybridDatabaseClient implements IDataService {
  private tables: Record<string, any[]> = {};
  private _initialized = true;

  constructor(initialData: Record<string, any[]> = {}) {
    this.tables = { ...initialData };
  }

  async initialize(): Promise<void> { this._initialized = true; }
  async dispose(): Promise<void> { this.tables = {}; }
  async connect(): Promise<void> { /* no-op */ }
  async disconnect(): Promise<void> { /* no-op */ }
  async clear(): Promise<void> { this.tables = {}; }

  async query<T>(table: string, options?: { limit?: number }): Promise<T[]> {
    const data = this.tables[table] || [];
    if (options?.limit) {
      return data.slice(0, options.limit);
    }
    return [...data];
  }

  async findOne<T extends { id: string }>(table: string, id: string): Promise<T | null> {
    const data = this.tables[table] || [];
    return (data.find((row: T) => row.id === id) || null);
  }

  async insert<T extends { id: string }>(table: string, row: Partial<T>): Promise<T> {
    if (!this.tables[table]) this.tables[table] = [];
    const newRow = { ...row, id: row.id || Math.random().toString(36).slice(2) };
    this.tables[table].push(newRow);
    return newRow as T;
  }

  async update<T extends { id: string }>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    const rows = this.tables[table] || [];
    const idx = rows.findIndex((row: T) => row.id === id);
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...data };
      return rows[idx] as T;
    }
    return null;
  }

  async delete(table: string, id: string): Promise<void> {
    if (!this.tables[table]) return;
    this.tables[table] = this.tables[table].filter((row: any) => row.id !== id);
  }

  async beginTransaction(): Promise<void> { /* no-op */ }
  async commitTransaction(): Promise<void> { /* no-op */ }
  async rollbackTransaction(): Promise<void> { /* no-op */ }
  async batch<T>(table: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void> { /* no-op */ }
  async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> { return []; }

  getType(): string { return 'mock'; }
  isInitialized(): boolean { return this._initialized; }
  getConfig(): any { return {}; }

  // 可选事件API
  on?(event: string, handler: (...args: any[]) => void): void { /* no-op */ }
  off?(event: string, handler: (...args: any[]) => void): void { /* no-op */ }
}
