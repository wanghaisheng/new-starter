// client/data-initializer/index.ts

// 导出类型
export type { ClientDataInitializerOptions, IClientDataInitializer } from './types/client-data-initializer';
export type { IClientDataInitializerAdapter } from './types/client-data-initializer-adapter';

// 导出服务
export { ClientDataInitializer, ClientDataInitializerService } from './service/client-data-initializer-service';

// 导出工厂
export { ClientDataInitializerAdapterFactory } from './factory/client-data-initializer-adapter-factory';

// 导出适配器
export { LocalStorageDataInitializerAdapter } from './adapters/local-storage-data-initializer-adapter';