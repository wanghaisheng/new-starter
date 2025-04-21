import { IDataService } from '../types/MockDataService';

/**
 * Mock 数据服务适配器（兼容旧实现，可选保留，推荐用 MemoryMockDataServiceAdapter 替代）
 */
export class MockDataServiceAdapter implements IDataService {
  private data: any[] = [];

  getData() {
    return this.data;
  }

  setData(data: any[]) {
    this.data = data;
  }

  addData(item: any) {
    this.data.push(item);
  }

  findData(predicate: (item: any) => boolean) {
    return this.data.filter(predicate);
  }

  updateData(id: string, patch: Partial<any>) {
    const idx = this.data.findIndex((item) => item.id === id);
    if (idx >= 0) {
      this.data[idx] = { ...this.data[idx], ...patch };
    }
  }

  removeData(id: string) {
    this.data = this.data.filter((item) => item.id !== id);
  }
}
