/**
 * 认证事件类型
 */
export enum AuthEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PROFILE_UPDATED = 'profile_updated',
  AUTH_STATE_CHANGED = 'auth_state_changed',
  ERROR = 'error'
}

/**
 * 认证事件数据
 */
export interface AuthEventData {
  user?: any;
  error?: Error;
  timestamp: number;
}

/**
 * 认证事件监听器
 */
export type AuthEventListener = (eventType: AuthEventType, data: AuthEventData) => void;

/**
 * 认证事件管理器
 * 用于发布和订阅认证相关事件
 */
export class AuthEventManager {
  private static instance: AuthEventManager | null = null;
  private listeners: Map<AuthEventType, Set<AuthEventListener>> = new Map();
  
  private constructor() {}
  
  /**
   * 获取事件管理器实例
   */
  public static getInstance(): AuthEventManager {
    if (!AuthEventManager.instance) {
      AuthEventManager.instance = new AuthEventManager();
    }
    return AuthEventManager.instance;
  }
  
  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  public addEventListener(eventType: AuthEventType, listener: AuthEventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)?.add(listener);
  }
  
  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  public removeEventListener(eventType: AuthEventType, listener: AuthEventListener): void {
    this.listeners.get(eventType)?.delete(listener);
  }
  
  /**
   * 发布事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  public emit(eventType: AuthEventType, data: AuthEventData): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(eventType, data);
        } catch (error) {
          console.error(`Error in auth event listener for ${eventType}:`, error);
        }
      });
    }
    
    // 同时触发认证状态变更事件
    if (eventType !== AuthEventType.AUTH_STATE_CHANGED) {
      this.emit(AuthEventType.AUTH_STATE_CHANGED, {
        ...data,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * 清空所有监听器
   */
  public clearListeners(): void {
    this.listeners.clear();
  }
} 