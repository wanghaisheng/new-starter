import { DataInitializerRegistry } from '../registry/data-initializer-registry';
import { IDataInitializerAdapter } from '../types/data-initializer-adapter';

export class DataInitializerFactory {
  static createAdapter(type: string, config: any): IDataInitializerAdapter {
    DataInitializerRegistry.registerAllAdapters();
    const adapter = DataInitializerRegistry.getAdapter(type, config);
    if (!adapter) throw new Error(`No adapter registered for type: ${type}`);
    return adapter;
  }
}
