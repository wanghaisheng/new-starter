import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
import { MemoryDataInitializerAdapter } from '../adapters/memory-adapter';
import { JsonDataInitializerAdapter } from '../adapters/json-adapter';
import { SqlDataInitializerAdapter } from '../adapters/sql-adapter';
import { SchemaDataInitializerAdapter } from '../adapters/schema-adapter';

export class DataInitializerRegistry {
  private static adapters: Record<string, (config: any) => IDataInitializerAdapter> = {};

  static registerAdapter(type: string, factory: (config: any) => IDataInitializerAdapter) {
    if (!type || typeof factory !== 'function') {
      throw new Error(`[DataInitializerRegistry] 注册 adapter 参数非法: type=${type}`);
    }
    if (this.adapters[type]) {
      throw new Error(`[DataInitializerRegistry] adapter 已经注册: type=${type}`);
    }
    this.adapters[type] = factory;
  }

  static getAdapter(type: string, config: any): IDataInitializerAdapter | undefined {
    if (!type) return undefined;
    const factory = this.adapters[type];
    return factory ? factory(config) : undefined;
  }

  static registerAllAdapters() {
    // 避免重复注册
    if (Object.keys(this.adapters).length > 0) return;
    this.registerAdapter('memory', (config) => new MemoryDataInitializerAdapter(config));
    this.registerAdapter('json', (config) => new JsonDataInitializerAdapter(config));
    this.registerAdapter('sql', (config) => new SqlDataInitializerAdapter(config));
    this.registerAdapter('schema', (config) => new SchemaDataInitializerAdapter(config));
    // 可在此扩展更多自定义 adapter
  }
}
