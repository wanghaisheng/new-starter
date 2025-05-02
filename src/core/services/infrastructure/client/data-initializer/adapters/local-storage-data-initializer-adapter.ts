// client/data-initializer/adapters/local-storage-data-initializer-adapter.ts
import type { IClientDataInitializerAdapter } from '../types/client-data-initializer-adapter';
import type { ClientDataInitializerOptions } from '../types/client-data-initializer';

/**
 * LocalStorage数据初始化适配器
 * 使用localStorage作为存储介质实现数据初始化
 */
export class LocalStorageDataInitializerAdapter implements IClientDataInitializerAdapter {
  // 初始化标记前缀
  private readonly INIT_PREFIX = 'data_init_';
  
  /**
   * 初始化数据库结构
   * 对于localStorage，不需要特殊的结构初始化
   * @returns 是否成功
   */
  public async initializeSchema(): Promise<boolean> {
    console.log('[LocalStorageDataInitializerAdapter] 初始化数据库结构');
    // localStorage不需要特殊的结构初始化
    return true;
  }

  /**
   * 导入数据
   * @param options 初始化选项
   * @returns 是否成功
   */
  public async importData(options: ClientDataInitializerOptions): Promise<boolean> {
    try {
      console.log('[LocalStorageDataInitializerAdapter] 开始导入数据');
      
      // 如果没有模拟数据，则跳过
      if (!options.mockData) {
        console.log('[LocalStorageDataInitializerAdapter] 没有提供模拟数据，跳过导入');
        return true;
      }
      
      // 获取仓储对象
      const { repositories, mockData } = options;
      
      // 遍历模拟数据，使用对应的仓储进行导入
      for (const [key, data] of Object.entries(mockData)) {
        // 获取对应的仓储
        const repositoryKey = `${key}Repository`;
        const repository = repositories[repositoryKey];
        
        if (!repository) {
          console.warn(`[LocalStorageDataInitializerAdapter] 未找到仓储: ${repositoryKey}，跳过导入`);
          continue;
        }
        
        // 检查仓储是否有bulkInsert方法
        if (typeof repository.bulkInsert === 'function') {
          console.log(`[LocalStorageDataInitializerAdapter] 使用${repositoryKey}批量导入${data.length}条数据`);
          await repository.bulkInsert(data);
        } else if (typeof repository.insert === 'function') {
          // 如果没有批量导入方法，则逐条导入
          console.log(`[LocalStorageDataInitializerAdapter] 使用${repositoryKey}逐条导入${data.length}条数据`);
          for (const item of data) {
            await repository.insert(item);
          }
        } else {
          console.warn(`[LocalStorageDataInitializerAdapter] ${repositoryKey}没有insert或bulkInsert方法，跳过导入`);
        }
      }
      
      console.log('[LocalStorageDataInitializerAdapter] 数据导入完成');
      return true;
    } catch (error) {
      console.error('[LocalStorageDataInitializerAdapter] 导入数据失败', error);
      return false;
    }
  }

  /**
   * 清空数据
   * @returns 是否成功
   */
  public async clearData(): Promise<boolean> {
    try {
      console.log('[LocalStorageDataInitializerAdapter] 清空数据');
      
      // 获取所有键
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith(this.INIT_PREFIX)) {
          keys.push(key);
        }
      }
      
      // 删除所有非初始化标记的键
      for (const key of keys) {
        localStorage.removeItem(key);
      }
      
      return true;
    } catch (error) {
      console.error('[LocalStorageDataInitializerAdapter] 清空数据失败', error);
      return false;
    }
  }

  /**
   * 检查是否已初始化
   * @param key 检查的键名
   * @returns 是否已初始化
   */
  public async isInitialized(key: string): Promise<boolean> {
    try {
      const initKey = `${this.INIT_PREFIX}${key}`;
      const value = localStorage.getItem(initKey);
      return value === 'true';
    } catch (error) {
      console.error('[LocalStorageDataInitializerAdapter] 检查初始化状态失败', error);
      return false;
    }
  }

  /**
   * 标记为已初始化
   * @param key 标记的键名
   * @returns 是否成功
   */
  public async markAsInitialized(key: string): Promise<boolean> {
    try {
      const initKey = `${this.INIT_PREFIX}${key}`;
      localStorage.setItem(initKey, 'true');
      return true;
    } catch (error) {
      console.error('[LocalStorageDataInitializerAdapter] 标记初始化状态失败', error);
      return false;
    }
  }
}