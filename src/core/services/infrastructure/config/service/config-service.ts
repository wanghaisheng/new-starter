// ConfigService 实现
import { IConfigAdapter } from '../types/config-adapter.types';

export class ConfigService {
  private static instance: ConfigService;
  private adapter: IConfigAdapter;
  private initialized = false;

  private constructor(adapter: IConfigAdapter) {
    this.adapter = adapter;
  }

  static getInstance(adapter: IConfigAdapter): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService(adapter);
    }
    return ConfigService.instance;
  }

  async initialize() {
    if (!this.initialized) {
      await this.adapter.initialize();
      this.initialized = true;
    }
  }

  get<T = any>(key: string): T | undefined {
    return this.adapter.get<T>(key);
  }

  set<T = any>(key: string, value: T) {
    this.adapter.set<T>(key, value);
  }

  has(key: string): boolean {
    return this.adapter.has(key);
  }

  remove(key: string) {
    this.adapter.remove(key);
  }
}

// 注释或移除找不到的 re-export，防止构建报错
// export * from '../config-manager';
