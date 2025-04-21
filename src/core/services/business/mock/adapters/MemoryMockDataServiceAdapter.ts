import { IDataService } from '../types/MockDataService';

/**
 * 内存 mock 适配器，所有数据仅存于内存，适合单元测试和快速开发。
 */
export class MemoryMockDataServiceAdapter implements IDataService {
  private memoryData: any[] = [];

  getData() {
    return this.memoryData;
  }

  setData(data: any[]) {
    this.memoryData = data;
  }

  addData(item: any) {
    this.memoryData.push(item);
  }

  findData(predicate: (item: any) => boolean) {
    return this.memoryData.filter(predicate);
  }

  updateData(id: string, patch: Partial<any>) {
    const idx = this.memoryData.findIndex((item) => item.id === id);
    if (idx >= 0) {
      this.memoryData[idx] = { ...this.memoryData[idx], ...patch };
    }
  }

  removeData(id: string) {
    this.memoryData = this.memoryData.filter((item) => item.id !== id);
  }
}
