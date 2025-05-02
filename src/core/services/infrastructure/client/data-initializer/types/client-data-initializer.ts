// client/data-initializer/types/client-data-initializer.ts

/**
 * 客户端数据初始化选项接口
 */
export interface ClientDataInitializerOptions {
  /**
   * 仓储对象集合
   * 用于执行数据操作的仓储实例
   */
  repositories: Record<string, any>;

  /**
   * 模拟数据
   * 用于初始化的本地数据
   */
  mockData?: Record<string, any[]>;

  /**
   * 环境标识
   * 如：development, production
   */
  env?: string;

  /**
   * 数据模式
   * 如：mock, local, remote
   */
  mode?: 'mock' | 'local' | 'remote';

  /**
   * 是否强制重置
   * 若为true，则清空现有数据后重新初始化
   */
  forceReset?: boolean;

  /**
   * 离线数据库类型
   * 如：indexeddb, localstorage, sqlite
   */
  offlineDbType?: 'indexeddb' | 'localstorage' | 'sqlite' | 'memory';
}

/**
 * 客户端数据初始化服务接口
 */
export interface IClientDataInitializer {
  /**
   * 初始化数据
   * @param options 初始化选项
   * @returns 是否成功
   */
  initialize(options: ClientDataInitializerOptions): Promise<boolean>;

  /**
   * 重置数据
   * @param options 初始化选项
   * @returns 是否成功
   */
  reset(options: ClientDataInitializerOptions): Promise<boolean>;

  /**
   * 检查是否已初始化
   * @param key 检查的键名
   * @returns 是否已初始化
   */
  isInitialized(key: string): Promise<boolean>;

  /**
   * 标记为已初始化
   * @param key 标记的键名
   * @returns 是否成功
   */
  markAsInitialized(key: string): Promise<boolean>;
}