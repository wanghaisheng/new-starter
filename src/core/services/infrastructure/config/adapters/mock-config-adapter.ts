// mock-config-adapter.ts
import { IConfigAdapter } from '../types/config-adapter.types';

export class MockConfigAdapter implements IConfigAdapter {
  private store: Record<string, any> = {
    ENV_STAGE: 'mock',
    API_BASE_URL: 'http://localhost:3000',
    DATA_MODE: 'offline-only',
    PROVIDER_TYPE: 'mock',
    // ...其它 mock 配置
  };

  async initialize() { /* 可扩展为异步加载 mock 配置文件 */ }
  get<T = any>(key: string): T | undefined { return this.store[key]; }
  set<T = any>(key: string, value: T) { this.store[key] = value; }
  has(key: string): boolean { return key in this.store; }
  remove(key: string) { delete this.store[key]; }
}
