// client/data-initializer/factory/client-data-initializer-adapter-factory.ts
import type { IClientDataInitializerAdapter } from '../types/client-data-initializer-adapter';
import { LocalStorageDataInitializerAdapter } from '../adapters/local-storage-data-initializer-adapter';

/**
 * 客户端数据初始化适配器工厂
 * 负责创建不同存储类型的数据初始化适配器
 */
export class ClientDataInitializerAdapterFactory {
  /**
   * 创建适配器
   * @param type 存储类型
   * @returns 适配器实例
   */
  public static async createAdapter(type: string): Promise<IClientDataInitializerAdapter> {
    switch (type) {
      case 'localstorage':
        return new LocalStorageDataInitializerAdapter();
      case 'indexeddb':
        // 未来可以实现IndexedDB适配器
        console.log('[ClientDataInitializerAdapterFactory] IndexedDB适配器尚未实现，使用LocalStorage适配器代替');
        return new LocalStorageDataInitializerAdapter();
      case 'sqlite':
        // 未来可以实现SQLite适配器
        console.log('[ClientDataInitializerAdapterFactory] SQLite适配器尚未实现，使用LocalStorage适配器代替');
        return new LocalStorageDataInitializerAdapter();
      case 'memory':
        // 未来可以实现内存适配器
        console.log('[ClientDataInitializerAdapterFactory] 内存适配器尚未实现，使用LocalStorage适配器代替');
        return new LocalStorageDataInitializerAdapter();
      default:
        console.log(`[ClientDataInitializerAdapterFactory] 未知存储类型: ${type}，使用LocalStorage适配器代替`);
        return new LocalStorageDataInitializerAdapter();
    }
  }
}