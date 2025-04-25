// config-events.ts
// 轻量事件总线，支持 Node/浏览器环境

export type ConfigEventCallback = (key: string, value: any) => void;

class ConfigEventBus {
  private listeners: Map<string, Set<ConfigEventCallback>> = new Map();

  /** 订阅单个配置项变更 */
  on(key: string, cb: ConfigEventCallback) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(cb);
  }

  /** 取消订阅 */
  off(key: string, cb: ConfigEventCallback) {
    this.listeners.get(key)?.delete(cb);
  }

  /** 触发配置变更事件 */
  emit(key: string, value: any) {
    this.listeners.get(key)?.forEach(cb => {
      try { cb(key, value); } catch (e) { /* 忽略单个订阅异常 */ }
    });
  }

  /** 清空所有监听 */
  clear() {
    this.listeners.clear();
  }
}

export const configEventBus = new ConfigEventBus();
