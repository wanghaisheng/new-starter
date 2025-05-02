// client/data-initializer/types/client-data-initializer-adapter.ts
import type { ClientDataInitializerOptions } from './client-data-initializer';

/**
 * 客户端数据初始化适配器接口
 * 定义不同存储类型的数据初始化方法
 */
export interface IClientDataInitializerAdapter {
  /**
   * 初始化数据库结构
   * @returns 是否成功
   */
  initializeSchema(): Promise<boolean>;

  /**
   * 导入数据
   * @param options 初始化选项
   * @returns 是否成功
   */
  importData(options: ClientDataInitializerOptions): Promise<boolean>;

  /**
   * 清空数据
   * @returns 是否成功
   */
  clearData(): Promise<boolean>;

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