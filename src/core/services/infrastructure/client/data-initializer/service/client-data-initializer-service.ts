// client/data-initializer/service/client-data-initializer-service.ts
import type { IClientDataInitializer, ClientDataInitializerOptions } from '../types/client-data-initializer';
import type { IClientDataInitializerAdapter } from '../types/client-data-initializer-adapter';
import { ClientDataInitializerAdapterFactory } from '../factory/client-data-initializer-adapter-factory';

/**
 * 客户端数据初始化服务
 * 负责客户端本地环境下的数据库初始化与数据导入
 */
export class ClientDataInitializerService implements IClientDataInitializer {
  private static instance: ClientDataInitializerService;
  private adapter: IClientDataInitializerAdapter | null = null;

  private constructor() {
    // 私有构造函数，防止直接实例化
  }

  /**
   * 获取单例实例
   * @returns ClientDataInitializerService实例
   */
  public static getInstance(): ClientDataInitializerService {
    if (!ClientDataInitializerService.instance) {
      ClientDataInitializerService.instance = new ClientDataInitializerService();
    }
    return ClientDataInitializerService.instance;
  }

  /**
   * 初始化数据
   * @param options 初始化选项
   * @returns 是否成功
   */
  public async initialize(options: ClientDataInitializerOptions): Promise<boolean> {
    try {
      // 获取适配器
      this.adapter = await this.getAdapter(options);
      
      // 检查是否已初始化
      const dbKey = `db_initialized_${options.env || 'default'}`;
      const isInit = await this.isInitialized(dbKey);
      
      // 如果已初始化且不强制重置，则跳过
      if (isInit && !options.forceReset) {
        console.log('[ClientDataInitializerService] 数据库已初始化，跳过初始化过程');
        return true;
      }
      
      // 如果强制重置，先清空数据
      if (options.forceReset) {
        await this.adapter.clearData();
      }
      
      // 初始化数据库结构
      await this.adapter.initializeSchema();
      
      // 导入数据
      await this.adapter.importData(options);
      
      // 标记为已初始化
      await this.markAsInitialized(dbKey);
      
      console.log('[ClientDataInitializerService] 数据库初始化成功');
      return true;
    } catch (error) {
      console.error('[ClientDataInitializerService] 初始化失败', error);
      return false;
    }
  }

  /**
   * 重置数据
   * @param options 初始化选项
   * @returns 是否成功
   */
  public async reset(options: ClientDataInitializerOptions): Promise<boolean> {
    try {
      // 强制重置
      const resetOptions = { ...options, forceReset: true };
      return await this.initialize(resetOptions);
    } catch (error) {
      console.error('[ClientDataInitializerService] 重置失败', error);
      return false;
    }
  }

  /**
   * 检查是否已初始化
   * @param key 检查的键名
   * @returns 是否已初始化
   */
  public async isInitialized(key: string): Promise<boolean> {
    if (!this.adapter) {
      return false;
    }
    return await this.adapter.isInitialized(key);
  }

  /**
   * 标记为已初始化
   * @param key 标记的键名
   * @returns 是否成功
   */
  public async markAsInitialized(key: string): Promise<boolean> {
    if (!this.adapter) {
      return false;
    }
    return await this.adapter.markAsInitialized(key);
  }

  /**
   * 获取适配器
   * @param options 初始化选项
   * @returns 适配器实例
   */
  private async getAdapter(options: ClientDataInitializerOptions): Promise<IClientDataInitializerAdapter> {
    // 使用工厂创建适配器
    return await ClientDataInitializerAdapterFactory.createAdapter(options.offlineDbType || 'localstorage');
  }
}

// 导出静态方法，方便直接调用
export const ClientDataInitializer = {
  /**
   * 初始化数据
   * @param options 初始化选项
   * @returns 是否成功
   */
  initialize: async (options: ClientDataInitializerOptions): Promise<boolean> => {
    return await ClientDataInitializerService.getInstance().initialize(options);
  },

  /**
   * 重置数据
   * @param options 初始化选项
   * @returns 是否成功
   */
  reset: async (options: ClientDataInitializerOptions): Promise<boolean> => {
    return await ClientDataInitializerService.getInstance().reset(options);
  },

  /**
   * 检查是否已初始化
   * @param key 检查的键名
   * @returns 是否已初始化
   */
  isInitialized: async (key: string): Promise<boolean> => {
    return await ClientDataInitializerService.getInstance().isInitialized(key);
  },

  /**
   * 标记为已初始化
   * @param key 标记的键名
   * @returns 是否成功
   */
  markAsInitialized: async (key: string): Promise<boolean> => {
    return await ClientDataInitializerService.getInstance().markAsInitialized(key);
  }
};