import { MemoryMockDataServiceAdapter } from '../adapters/MemoryMockDataServiceAdapter';
import { JsonMockDataServiceAdapter } from '../adapters/JsonMockDataServiceAdapter';
import { TestDbMockDataServiceAdapter } from '../adapters/TestDbMockDataServiceAdapter';
import { IDataService } from '../types/MockDataService';

/**
 * Mock 数据服务工厂，支持多种 mock adapter 策略
 */
export class MockDataServiceFactory {
  static createService(type: 'memory' | 'json' | 'testdb' = 'memory'): IDataService {
    switch (type) {
      case 'json':
        return new JsonMockDataServiceAdapter();
      case 'testdb':
        return new TestDbMockDataServiceAdapter();
      case 'memory':
      default:
        return new MemoryMockDataServiceAdapter();
    }
  }
}
