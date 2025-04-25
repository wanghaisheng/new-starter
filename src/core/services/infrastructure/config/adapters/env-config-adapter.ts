// env-config-adapter.ts
import { IConfigAdapter } from '../types/config-adapter';
import { CONFIG_KEYS } from '../config-keys';

const ENV_KEYS = Object.values(CONFIG_KEYS);

export class EnvConfigAdapter implements IConfigAdapter {
  private store: Record<string, any> = {};

  async initialize() {
    ENV_KEYS.forEach(key => {
      if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
        this.store[key] = process.env[key];
      } else if (typeof window !== 'undefined' && (window as any)[key] !== undefined) {
        // 支持浏览器端通过 window 注入
        this.store[key] = (window as any)[key];
      }
    });
  }
  get<T = any>(key: string): T | undefined { return this.store[key]; }
  set<T = any>(key: string, value: T) { this.store[key] = value; }
  has(key: string): boolean { return key in this.store; }
  remove(key: string) { delete this.store[key]; }
  async refresh(key?: string): Promise<void> {
    // 环境变量不支持运行时刷新，直接返回
  }
}
