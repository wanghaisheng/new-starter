import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
import { MemoryDataInitializerAdapter } from '../adapters/memory-adapter';
import { JsonDataInitializerAdapter } from '../adapters/json-adapter';
import { SqlDataInitializerAdapter } from '../adapters/sql-adapter';

export class DataInitializerRegistry {
  private static adapters: Record<string, (config: any) => IDataInitializerAdapter> = {};

  static registerAdapter(type: string, factory: (config: any) => IDataInitializerAdapter) {
    this.adapters[type] = factory;
  }

  static getAdapter(type: string, config: any): IDataInitializerAdapter | undefined {
    const factory = this.adapters[type];
    return factory ? factory(config) : undefined;
  }

  static registerAllAdapters() {
    this.registerAdapter('memory', (config) => new MemoryDataInitializerAdapter(config));
    this.registerAdapter('json', (config) => new JsonDataInitializerAdapter(config));
    this.registerAdapter('sql', (config) => new SqlDataInitializerAdapter(config));
  }
}
