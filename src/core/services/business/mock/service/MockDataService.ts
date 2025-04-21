import { IDataService } from '../types/MockDataService';
import { MockDataServiceAdapter } from '../adapters/MockDataServiceAdapter';

/**
 * MockDataService 业务实现，组合适配器并扩展业务逻辑
 */
export class MockDataService implements IDataService {
  private adapter: MockDataServiceAdapter;
  constructor() {
    this.adapter = new MockDataServiceAdapter();
  }
  getData() {
    // 可以在此扩展业务逻辑（如日志、数据加工等）
    return this.adapter.getData();
  }
  // 其他业务方法可继续扩展
}
