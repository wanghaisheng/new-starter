import { IDataService } from '../types/MockDataService';
import fs from 'fs';
import path from 'path';

/**
 * JSON 文件 mock 适配器，数据持久化在 JSON 文件。
 */
export class JsonMockDataServiceAdapter implements IDataService {
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath || path.resolve(__dirname, '../data/dating-data.json');
  }

  getData() {
    if (!fs.existsSync(this.filePath)) return [];
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    return JSON.parse(raw);
  }

  setData(data: any[]) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  addData(item: any) {
    const arr = this.getData();
    arr.push(item);
    this.setData(arr);
  }

  findData(predicate: (item: any) => boolean) {
    return this.getData().filter(predicate);
  }

  updateData(id: string, patch: Partial<any>) {
    const arr = this.getData();
    const idx = arr.findIndex((item) => item.id === id);
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...patch };
      this.setData(arr);
    }
  }

  removeData(id: string) {
    const arr = this.getData().filter((item) => item.id !== id);
    this.setData(arr);
  }
}
