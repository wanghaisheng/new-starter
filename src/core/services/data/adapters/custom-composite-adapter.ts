import { IDataService } from '../types';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
export type CompositeHook = {
  beforeGet?: (key: string) => void;
  afterGet?: (key: string, value: any) => void;
  beforeSet?: (key: string, value: any) => void;
  afterSet?: (key: string, value: any) => void;
  // 可扩展更多横切 hook
};

/**
 * CustomCompositeAdapter
 * 支持横向组合多个 IDataService，并通过 hooks 注入横切逻辑。
 */
export class CustomCompositeAdapter implements IDataService<BaseEntity> {
  constructor(
    private adapters: IDataService<BaseEntity>[],
    private hooks?: CompositeHook
  ) {}

  async get(key: string): Promise<BaseEntity | undefined> {
    this.hooks?.beforeGet?.(key);
    for (const adapter of this.adapters) {
      if (typeof adapter.get === 'function') {
        const value = await adapter.get(key);
        if (value !== undefined) {
          this.hooks?.afterGet?.(key, value);
          return value;
        }
      }
    }
    this.hooks?.afterGet?.(key, undefined);
    return undefined;
  }

  async set(key: string, value: BaseEntity): Promise<void> {
    this.hooks?.beforeSet?.(key, value);
    for (const adapter of this.adapters) {
      if (typeof adapter.set === 'function') {
        await adapter.set(key, value);
      }
    }
    this.hooks?.afterSet?.(key, value);
  }

  /**
   * findOne: 依次查找所有适配器，返回第一个命中的数据
   */
  async findOne(tableName: string, id: string): Promise<BaseEntity | null> {
    for (const adapter of this.adapters) {
      if (typeof adapter.findOne === 'function') {
        const result = await adapter.findOne(tableName, id);
        if (result !== null && result !== undefined) return result;
      }
    }
    return null;
  }

  /**
   * insert: 将数据插入所有适配器，返回第一个插入结果
   */
  async insert(tableName: string, data: Partial<BaseEntity>): Promise<BaseEntity> {
    let inserted: BaseEntity | undefined;
    for (const adapter of this.adapters) {
      if (typeof adapter.insert === 'function') {
        const res = await adapter.insert(tableName, data);
        if (inserted === undefined) inserted = res;
      }
    }
    if (inserted === undefined) throw new Error('No adapter could insert data');
    return inserted;
  }

  /**
   * update: 更新所有适配器
   */
  async update(tableName: string, id: string, data: Partial<BaseEntity>): Promise<void> {
    for (const adapter of this.adapters) {
      if (typeof adapter.update === 'function') {
        await adapter.update(tableName, id, data);
      }
    }
  }

  /**
   * delete: 删除所有适配器中的指定数据
   */
  async delete(tableName: string, id: string): Promise<void> {
    for (const adapter of this.adapters) {
      if (typeof adapter.delete === 'function') {
        await adapter.delete(tableName, id);
      }
    }
  }

  /**
   * findAll: 合并所有 adapter 的结果并去重，兼容 HybridDatabaseClient/AdvancedHybridDatabaseClient
   */
  async findAll(tableName: string, filter?: Record<string, any>): Promise<BaseEntity[]> {
    const allResults = await Promise.all(
      this.adapters.map(async a => {
        if (typeof a.findAll === 'function') {
          return await a.findAll(tableName, filter);
        } else if (typeof a.query === 'function') {
          const result = await a.query(tableName, { filter: filter || {} });
          return result?.items || [];
        }
        return [];
      })
    );
    const flat = ([] as BaseEntity[]).concat(...allResults);
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

  getType(): string {
    return 'composite';
  }

  isInitialized(): boolean {
    return this.adapters.every(a => a.isInitialized?.() ?? true);
  }

  async initialize(config?: any): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.initialize?.(config);
    }
  }

  async dispose(): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.dispose?.();
    }
  }

  // --- IDataService 规范补全 ---
  async connect(): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.connect?.();
    }
  }

  async disconnect(): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.disconnect?.();
    }
  }

  async clear(): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.clear?.();
    }
  }

  async query(collection: string, options: any): Promise<any> {
    // 只返回第一个有结果的 query
    for (const adapter of this.adapters) {
      if (typeof adapter.query === 'function') {
        const res = await adapter.query(collection, options);
        if (res) return res;
      }
    }
    return null;
  }

  async batch(collection: string, operations: any[]): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.batch?.(collection, operations);
    }
  }

  async executeRawQuery(query: string, params?: any[]): Promise<any[]> {
    for (const adapter of this.adapters) {
      if (typeof adapter.executeRawQuery === 'function') {
        const res = await adapter.executeRawQuery(query, params);
        if (res && res.length > 0) return res;
      }
    }
    return [];
  }

  async beginTransaction(): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.beginTransaction?.();
    }
  }

  async commitTransaction(): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.commitTransaction?.();
    }
  }

  async rollbackTransaction(): Promise<void> {
    for (const adapter of this.adapters) {
      await adapter.rollbackTransaction?.();
    }
  }

  getConfig(): any {
    // 返回第一个 adapter 的 config，或组合
    return this.adapters[0]?.getConfig?.();
  }

  // --- 事件监听标准化 ---
  on<E extends keyof import('../types').IDataServiceEventListenerMap>(
    event: E,
    listener: import('../types').IDataServiceEventListenerMap[E]
  ): () => void {
    const offFns: (() => void)[] = [];
    for (const adapter of this.adapters) {
      if (typeof adapter.on === 'function') {
        // 强制类型断言，保证参数类型兼容
        const off = (adapter.on as any)(event, listener);
        if (typeof off === 'function') offFns.push(off);
      }
    }
    return () => { offFns.forEach(fn => fn && fn()); };
  }

  off<E extends keyof import('../types').IDataServiceEventListenerMap>(
    event: E,
    listener: import('../types').IDataServiceEventListenerMap[E]
  ): void {
    for (const adapter of this.adapters) {
      if (typeof adapter.off === 'function') {
        (adapter.off as any)(event, listener);
      }
    }
  }
}
