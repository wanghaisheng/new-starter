// ConfigService 实现
import { IConfigAdapter } from '../types/config-adapter.types';
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

  // 支持运行时变量热更新（如远程配置变更自动生效）
  async refresh() {
    if (typeof this.adapter.refresh === 'function') {
      // 只通过 get 方法访问所有 key，避免类型隐患
      const keys = Object.keys(CONFIG_KEYS);
      const oldSnapshot: Record<string, any> = {};
      keys.forEach(key => {
        oldSnapshot[key] = this.get(key);
      });
      await this.adapter.refresh();
      // 检查所有 key 是否有变更，逐一通知
      keys.forEach(key => {
        const newValue = this.get(key);
        if (oldSnapshot[key] !== newValue) {
          this.notify(key, newValue, oldSnapshot[key]);
        }
      });
    }
  }
}

// 注释或移除找不到的 re-export，防止构建报错
// export * from '../config-manager';
