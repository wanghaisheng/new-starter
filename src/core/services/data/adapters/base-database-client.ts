import type { IDataService, DataServiceConfig } from '../types';

// 事件与缓存机制基类
export abstract class BaseDatabaseClient implements IDataService {
  private eventHandlers: Record<string, Function[]> = {};
  private cacheEnabled = false;
  private cache = new Map<string, any>();

  constructor(config?: DataServiceConfig) {
    if (config?.cache) this.cacheEnabled = true;
  }

  // 事件API
  on(event: string, handler: (...args: any[]) => void): void {
    // No-op for base class, override in subclasses if needed
  }

  off(event: string, handler: (...args: any[]) => void): void {
    // No-op for base class, override in subclasses if needed
  }

  protected emit(event: string, ...args: any[]) {
    (this.eventHandlers[event] || []).forEach(h => h(...args));
  }

  // 缓存包装
  protected async cacheGetOrQuery<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    if (this.cacheEnabled && this.cache.has(key)) {
      return this.cache.get(key);
    }
    const result = await queryFn();
    if (this.cacheEnabled) this.cache.set(key, result);
    return result;
  }
  protected cacheInvalidate(key: string) {
    if (this.cacheEnabled) this.cache.delete(key);
  }
  protected cacheClear() {
    if (this.cacheEnabled) this.cache.clear();
  }

  // Abstract methods for IDataService compliance
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract clear(): Promise<void>;
  abstract findOne<T extends { id: string }>(tableName: string, id: string): Promise<T | null>;
  abstract query<T>(tableName: string, options?: any): Promise<T[]>;
  abstract insert<T extends { id: string }>(tableName: string, data: Partial<T>): Promise<T>;
  abstract update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<T | null>;
  abstract delete(tableName: string, id: string): Promise<void>;
  abstract beginTransaction(): Promise<void>;
  abstract commitTransaction(): Promise<void>;
  abstract rollbackTransaction(): Promise<void>;
  abstract batch<T>(tableName: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void>;
  abstract executeRawQuery<T>(query: string, params?: any[]): Promise<T[]>;
  abstract getType(): string;
  abstract isInitialized(): boolean;
  abstract getConfig(): any;

  // 子类需实现的核心方法
  abstract initialize(config?: DataServiceConfig): Promise<void>;

  // 可选销毁
  async dispose(): Promise<void> {
    this.cacheClear();
    this.eventHandlers = {};
    await this.disconnect();
  }
}
