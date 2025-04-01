/**
 * 网络管理器
 * 负责监控网络连接状态和事件
 */
export type NetworkEventHandler = () => void;

export interface NetworkManager {
  /**
   * 检查当前是否连接到网络
   */
  isConnected(): boolean;
  
  /**
   * 注册网络连接事件处理函数
   * 当网络重新连接时调用
   */
  onConnect(handler: NetworkEventHandler): void;
  
  /**
   * 注册网络断开事件处理函数
   * 当网络断开连接时调用
   */
  onDisconnect(handler: NetworkEventHandler): void;
  
  /**
   * 移除网络连接事件处理函数
   */
  offConnect(handler: NetworkEventHandler): void;
  
  /**
   * 移除网络断开事件处理函数
   */
  offDisconnect(handler: NetworkEventHandler): void;
  
  /**
   * 模拟网络延迟
   * 开发和测试时可用
   */
  simulateLatency(latencyMs: number): void;
  
  /**
   * 模拟网络离线状态
   * 开发和测试时可用
   */
  simulateOffline(offline: boolean): void;
}

/**
 * 浏览器网络管理器实现
 */
export class BrowserNetworkManager implements NetworkManager {
  private connectHandlers: NetworkEventHandler[] = [];
  private disconnectHandlers: NetworkEventHandler[] = [];
  private simulatedOffline: boolean = false;
  private latencyMs: number = 0;
  
  constructor() {
    // 浏览器环境下监听在线/离线事件
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  public isConnected(): boolean {
    // 如果模拟离线，则返回 false
    if (this.simulatedOffline) {
      return false;
    }
    
    // 浏览器环境下检查 navigator.onLine
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    
    // 默认返回 true
    return true;
  }
  
  public onConnect(handler: NetworkEventHandler): void {
    this.connectHandlers.push(handler);
  }
  
  public onDisconnect(handler: NetworkEventHandler): void {
    this.disconnectHandlers.push(handler);
  }
  
  public offConnect(handler: NetworkEventHandler): void {
    this.connectHandlers = this.connectHandlers.filter(h => h !== handler);
  }
  
  public offDisconnect(handler: NetworkEventHandler): void {
    this.disconnectHandlers = this.disconnectHandlers.filter(h => h !== handler);
  }
  
  public simulateLatency(latencyMs: number): void {
    this.latencyMs = latencyMs;
  }
  
  public simulateOffline(offline: boolean): void {
    const wasOffline = this.simulatedOffline;
    this.simulatedOffline = offline;
    
    // 如果状态变更，触发相应事件
    if (wasOffline && !offline) {
      this.notifyConnect();
    } else if (!wasOffline && offline) {
      this.notifyDisconnect();
    }
  }
  
  /**
   * 获取当前网络延迟（毫秒）
   */
  public getLatency(): number {
    return this.latencyMs;
  }
  
  /**
   * 处理网络在线事件
   */
  private handleOnline = (): void => {
    if (!this.simulatedOffline) {
      this.notifyConnect();
    }
  };
  
  /**
   * 处理网络离线事件
   */
  private handleOffline = (): void => {
    this.notifyDisconnect();
  };
  
  /**
   * 通知所有连接事件处理函数
   */
  private notifyConnect(): void {
    for (const handler of this.connectHandlers) {
      handler();
    }
  }
  
  /**
   * 通知所有断开事件处理函数
   */
  private notifyDisconnect(): void {
    for (const handler of this.disconnectHandlers) {
      handler();
    }
  }
  
  /**
   * 释放资源
   */
  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    this.connectHandlers = [];
    this.disconnectHandlers = [];
  }
}

/**
 * 创建适合当前环境的网络管理器
 */
export function createNetworkManager(): NetworkManager {
  return new BrowserNetworkManager();
} 