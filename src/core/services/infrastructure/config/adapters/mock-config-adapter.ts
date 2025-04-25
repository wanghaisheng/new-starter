// mock-config-adapter.ts
import { IConfigAdapter } from '../types/config-adapter';
import { CONFIG_KEYS } from '../config-keys';

const MOCK_KEYS = Object.values(CONFIG_KEYS);

export class MockConfigAdapter implements IConfigAdapter {
  private store: Record<string, any> = {};

  async initialize() {
    // 初始化时可按需填充 mock 数据，也支持外部注入
    MOCK_KEYS.forEach(key => {
      if (!(key in this.store)) {
        this.store[key] = undefined;
      }
    });
    // 可扩展为异步加载 mock 配置文件
  }
  get<T = any>(key: string): T | undefined { return this.store[key]; }
  set<T = any>(key: string, value: T) { this.store[key] = value; }
  has(key: string): boolean { return key in this.store; }
  remove(key: string) { delete this.store[key]; }
  async refresh(key?: string): Promise<void> {
    // Mock 配置不支持运行时刷新，直接返回
  }
}
