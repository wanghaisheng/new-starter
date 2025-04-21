import { MockDataServiceFactory } from '../factory/MockDataServiceFactory';
import type { IDataService } from '../types/MockDataService';

/**
 * Mock 数据服务注册表，支持多类型多实例注册与获取
 */
export class MockDataServiceRegistry {
  private static registry: Record<string, IDataService> = {};

  /**
   * 获取指定类型的 mock 服务实例（支持 memory/json/testdb）
   */
  static getInstance(type: 'memory' | 'json' | 'testdb' = 'memory'): IDataService {
    if (!this.registry[type]) {
      this.registry[type] = MockDataServiceFactory.createService(type);
    }
    return this.registry[type];
  }

  /**
   * 兼容 hooks 场景的 provider 用法
   */
  static getProvider(type: 'memory' | 'json' | 'testdb' = 'memory'): () => IDataService {
    return () => this.getInstance(type);
  }
}
