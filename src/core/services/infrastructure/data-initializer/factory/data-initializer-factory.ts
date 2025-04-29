import { DataInitializerRegistry } from '../registry/data-initializer-registry';
import { IDataInitializerAdapter } from '../types/data-initializer-adapter';
import { DbInitMode } from '@/core/lib/db/types/common';

export class DataInitializerFactory {
  /**
   * 根据初始化模式创建适配器，支持 DbInitMode 枚举和字符串
   * @param mode 初始化模式（DbInitMode 或 string）
   * @param config 适配器配置
   */
  static createAdapter(mode: DbInitMode | string, config: any): IDataInitializerAdapter {
    DataInitializerRegistry.registerAllAdapters(); // 确保每次都注册最新适配器
    // 支持枚举和字符串两种调用方式
    const type = typeof mode === 'string' ? mode.toLowerCase() : String(mode).toLowerCase();
    const adapter = DataInitializerRegistry.getAdapter(type, config);
    if (!adapter) throw new Error(`[DataInitializerFactory] No adapter registered for type: ${type}`);
    return adapter;
  }
}
