import { IDataService } from '../types/MockDataService';

/**
 * 测试数据库 mock 适配器（如可用 fake-indexeddb、sqlite-mock 等实现）
 * 这里只做接口占位，具体实现可根据实际测试数据库扩展。
 */
export class TestDbMockDataServiceAdapter implements IDataService {
  private db: any[] = [];

  getData() {
    return this.db;
  }

  setData(data: any[]) {
    this.db = data;
  }

  addData(item: any) {
    this.db.push(item);
  }

  findData(predicate: (item: any) => boolean) {
    return this.db.filter(predicate);
  }

  updateData(id: string, patch: Partial<any>) {
    const idx = this.db.findIndex((item) => item.id === id);
    if (idx >= 0) {
      this.db[idx] = { ...this.db[idx], ...patch };
    }
  }

  removeData(id: string) {
    this.db = this.db.filter((item) => item.id !== id);
  }
}
