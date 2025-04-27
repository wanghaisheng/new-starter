// 认证事件管理器，建议迁移至 registry 层或单独 events 目录
// 如需跨模块事件总线，建议统一放在 registry/events 或 core/events 下
export interface AuthEventData {
  type: string;
  payload?: any;
}

export type AuthEventHandler = (data: AuthEventData) => void;

export class AuthEventManager {
  private static instance: AuthEventManager;
  private listeners: AuthEventHandler[] = [];

  static getInstance() {
    if (!this.instance) this.instance = new AuthEventManager();
    return this.instance;
  }

  subscribe(handler: AuthEventHandler) {
    this.listeners.push(handler);
  }

  unsubscribe(handler: AuthEventHandler) {
    this.listeners = this.listeners.filter(h => h !== handler);
  }

  emit(data: AuthEventData) {
    this.listeners.forEach(handler => handler(data));
  }
}
