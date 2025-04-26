import { DataInitializerRegistry } from '../registry/data-initializer-registry';
import { IDataInitializerAdapter } from '../types/data-initializer-adapter';

export class DataInitializerFactory {
  static createAdapter(type: string, config: any): IDataInitializerAdapter {
    DataInitializerRegistry.registerAllAdapters(); // 确保每次都注册最新适配器
    const adapter = DataInitializerRegistry.getAdapter(type, config);
    if (!adapter) throw new Error(`No adapter registered for type: ${type}`);
    return adapter;
  }
}
