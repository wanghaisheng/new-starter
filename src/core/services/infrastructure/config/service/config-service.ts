// ConfigService 实现
import { IConfigAdapter } from '@/core/services/infrastructure/config/types/config-adapter';
import { CONFIG_KEYS, ConfigKey } from '../config-keys';
import { ConfigSchema } from '../config-types';
import { configEventBus } from '../events/config-events';

export type ConfigChangeCallback<T = any> = (newValue: T, oldValue: T) => void;

export class ConfigService {
  private static instance: ConfigService;
  private adapter: IConfigAdapter;
  private initialized = false;
  private listeners: Map<string, Set<ConfigChangeCallback<any>>> = new Map();

  private constructor(adapter: IConfigAdapter) {
    this.adapter = adapter;
  }

  static getInstance(adapter: IConfigAdapter): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService(adapter);
    }
    return ConfigService.instance;
  }

  // 仅测试用：重置单例实例
  static __test_resetInstance() {
    ConfigService.instance = undefined as any;
  }

  async initialize() {
    if (!this.initialized) {
      await this.adapter.initialize();
      this.initialized = true;
    }
  }

  get<K extends ConfigKey>(key: K): ConfigSchema[K] | undefined;
  get<T = any>(key: string): T | undefined;
  get(key: string): any {
    return this.adapter.get(key);
  }

  set<K extends ConfigKey>(key: K, value: ConfigSchema[K]): void;
  set<T = any>(key: string, value: T): void;
  set(key: string, value: any): void {
    const oldValue = this.get(key);
    this.adapter.set(key, value);
    if (oldValue !== value) this.notify(key, value, oldValue);
    // emit 全局事件
    configEventBus.emit(key, value);
  }

  has(key: ConfigKey | string): boolean {
    return this.adapter.has(key);
  }

  remove(key: ConfigKey | string) {
    this.adapter.remove(key);
    // emit 全局事件，值为 undefined
    configEventBus.emit(key as string, undefined);
  }

  // 订阅变量变更
  subscribe<K extends ConfigKey>(key: K, cb: ConfigChangeCallback<ConfigSchema[K]>): void;
  subscribe<T = any>(key: string, cb: ConfigChangeCallback<T>): void;
  subscribe(key: string, cb: ConfigChangeCallback<any>) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(cb);
    // 同步到全局事件总线
    configEventBus.on(key, (changedKey, value) => cb(value, this.get(key)));
  }

  unsubscribe<K extends ConfigKey>(key: K, cb: ConfigChangeCallback<ConfigSchema[K]>): void;
  unsubscribe<T = any>(key: string, cb: ConfigChangeCallback<T>): void;
  unsubscribe(key: string, cb: ConfigChangeCallback<any>) {
    this.listeners.get(key)?.delete(cb);
    configEventBus.off(key, (changedKey, value) => cb(value, this.get(key)));
  }

  // 主动触发本地监听器（内部调用）
  private notify(key: string, value: any, oldValue: any) {
    this.listeners.get(key)?.forEach(cb => {
      try { cb(value, oldValue); } catch (e) { /* 忽略单个异常 */ }
    });
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
