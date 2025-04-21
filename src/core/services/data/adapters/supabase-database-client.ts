// Minimal stub for SupabaseDatabaseClient to fix lint errors.
import type { DataServiceConfig } from '../types';

export class SupabaseDatabaseClient {
  protected config: DataServiceConfig;
  constructor(config: DataServiceConfig) { this.config = config; }
  async initialize(): Promise<void> {}
  async connect(): Promise<void> {}
  async disconnect(): Promise<void> {}
  async clear(): Promise<void> {}
  async findOne(collection: string, id: string): Promise<any> { return null; }
  async query(collection: string, query?: any): Promise<any[]> { return []; }
  async insert(collection: string, data: any): Promise<any> { return data; }
  async update(collection: string, id: string, data: any): Promise<any> { return { id, ...data }; }
  async delete(collection: string, id: string): Promise<void> {}
  async beginTransaction(): Promise<void> {}
  async commitTransaction(): Promise<void> {}
  async rollbackTransaction(): Promise<void> {}
  async batch<T>(collection: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void> {}
  async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> { return []; }
  getType(): string { return 'supabase'; }
  isInitialized(): boolean { return true; }
  getConfig(): DataServiceConfig { return this.config; }
  async dispose(): Promise<void> {
    // Add any cleanup logic if needed
    return Promise.resolve();
  }
  on(event: string, handler: (...args: any[]) => void): void {
    // No-op for compatibility
  }

  off(event: string, handler: (...args: any[]) => void): void {
    // No-op for compatibility
  }
}
