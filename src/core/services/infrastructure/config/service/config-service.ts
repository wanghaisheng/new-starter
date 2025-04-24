// ConfigService 实现
import { IConfigAdapter } from '../types/config-adapter';
import { CONFIG_KEYS, ConfigKey } from '../config-keys';
import { ConfigSchema } from '../config-types';

export type ConfigChangeCallback<T = any> = (newValue: T, oldValue: T) => void;

export class ConfigService {
  private static instance: ConfigService;
  private adapter: IConfigAdapter;
  private initialized = false;
  private listeners: Map<string, Set<ConfigChangeCallback>> = new Map();

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

  get<K extends ConfigKey, T = ConfigSchema[K]>(key: K): T | undefined;
  get<T = any>(key: string): T | undefined;
  get(key: string): any {
    return this.adapter.get(key);
  }

  set<K extends ConfigKey, T = ConfigSchema[K]>(key: K, value: T): void;
  set<T = any>(key: string, value: T): void;
  set(key: string, value: any): void {
    const oldValue = this.get(key);
    this.adapter.set(key, value);
    if (oldValue !== value) this.notify(key, value, oldValue);
  }

  has(key: ConfigKey | string): boolean {
    return this.adapter.has(key);
  }

  remove(key: ConfigKey | string) {
    this.adapter.remove(key);
  }

  // 订阅变量变更
  subscribe(key: string, cb: ConfigChangeCallback) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(cb);
  }
  unsubscribe(key: string, cb: ConfigChangeCallback) {
    this.listeners.get(key)?.delete(cb);
  }

  private notify(key: string, newValue: any, oldValue: any) {
    this.listeners.get(key)?.forEach(cb => cb(newValue, oldValue));
  }

  /**
   * 刷新配置，支持刷新单个 key 或全部 keys。
   * 
   * @param key 要刷新的 key，如果不传则刷新所有 key。
   */
  async refresh(key?: string) {
    if (typeof this.adapter.refresh === 'function') {
      if (key) {
        const oldValue = this.get(key);
        await this.adapter.refresh(key);
        const newValue = this.get(key);
        if (oldValue !== newValue) {
          this.notify(key, newValue, oldValue);
        }
      } else {
        const keys = Object.keys(CONFIG_KEYS);
        const oldSnapshot: Record<string, any> = {};
        keys.forEach(k => {
          oldSnapshot[k] = this.get(k);
        });
        await this.adapter.refresh();
        keys.forEach(k => {
          const newValue = this.get(k);
          if (oldSnapshot[k] !== newValue) {
            this.notify(k, newValue, oldSnapshot[k]);
          }
        });
      }
    }
  }
}

// 注释或移除找不到的 re-export，防止构建报错
// export * from '../config-manager';
