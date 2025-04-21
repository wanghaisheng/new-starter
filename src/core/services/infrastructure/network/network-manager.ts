/**
 * 网络管理器扩展：支持多状态与跨端能力
 */
export type NetworkStatus = 'online' | 'offline' | 'limited' | 'proxy' | 'slow' | 'unknown';

export type NetworkEventHandler = (status: NetworkStatus) => void;

export interface NetworkManager {
  /** 当前网络状态 */
  getStatus(): NetworkStatus;
  /** 是否可用（online/limited/slow 视为可用） */
  isConnected(): boolean;
  /** 注册网络状态变更事件（跨端） */
  onStatusChange(handler: NetworkEventHandler): void;
  offStatusChange(handler: NetworkEventHandler): void;
  /** 兼容旧接口 */
  onConnect(handler: () => void): void;
  onDisconnect(handler: () => void): void;
  offConnect(handler: () => void): void;
  offDisconnect(handler: () => void): void;
  /** 模拟网络能力（开发/测试用） */
  simulateLatency(latencyMs: number): void;
  simulateOffline(offline: boolean): void;
}

export class BrowserNetworkManager implements NetworkManager {
  private status: NetworkStatus = 'unknown';
  private connectHandlers: (() => void)[] = [];
  private disconnectHandlers: (() => void)[] = [];
  private statusHandlers: NetworkEventHandler[] = [];
  private simulatedOffline: boolean = false;
  private latencyMs: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      // 监听网络信息 API（部分浏览器支持）
      if ((navigator as any).connection) {
        (navigator as any).connection.addEventListener('change', this.handleConnectionChange);
      }
      this.updateStatus();
    }
  }

  getStatus(): NetworkStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'online' || this.status === 'limited' || this.status === 'slow';
  }

  onStatusChange(handler: NetworkEventHandler): void {
    this.statusHandlers.push(handler);
  }
  offStatusChange(handler: NetworkEventHandler): void {
    this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
  }

  onConnect(handler: () => void): void {
    this.connectHandlers.push(handler);
  }
  onDisconnect(handler: () => void): void {
    this.disconnectHandlers.push(handler);
  }
  offConnect(handler: () => void): void {
    this.connectHandlers = this.connectHandlers.filter(h => h !== handler);
  }
  offDisconnect(handler: () => void): void {
    this.disconnectHandlers = this.disconnectHandlers.filter(h => h !== handler);
  }

  simulateLatency(latencyMs: number): void { this.latencyMs = latencyMs; }
  simulateOffline(offline: boolean): void {
    this.simulatedOffline = offline;
    this.updateStatus();
  }

  private handleOnline = () => {
    this.updateStatus('online');
    this.connectHandlers.forEach(h => h());
  };
  private handleOffline = () => {
    this.updateStatus('offline');
    this.disconnectHandlers.forEach(h => h());
  };
  private handleConnectionChange = () => {
    this.updateStatus();
  };
  private updateStatus(forced?: NetworkStatus) {
    let newStatus: NetworkStatus = forced || 'unknown';
    if (this.simulatedOffline) {
      newStatus = 'offline';
    } else if (typeof window !== 'undefined' && navigator.onLine) {
      // 尝试获取更详细的网络信息
      const conn = (navigator as any).connection;
      if (conn) {
        if (conn.saveData) newStatus = 'limited';
        else if (conn.type === 'cellular' && conn.effectiveType === '2g') newStatus = 'slow';
        else if (conn.type === 'wifi' || conn.type === 'ethernet') newStatus = 'online';
        else if (conn.type === 'cellular' && conn.effectiveType === '3g') newStatus = 'limited';
        else if (conn.type === 'cellular' && conn.effectiveType === '4g') newStatus = 'online';
        else if (conn.type === 'none') newStatus = 'offline';
        else if (conn.type === 'unknown') newStatus = 'unknown';
        // 可扩展代理/受限状态
        else if (conn.type === 'other') newStatus = 'proxy';
      } else {
        newStatus = 'online';
      }
    } else {
      newStatus = 'offline';
    }
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusHandlers.forEach(h => h(this.status));
    }
  }
}

// Native/Hybrid 网络管理器实现（示例，需实际环境适配）
export class NativeNetworkManager implements NetworkManager {
  private status: NetworkStatus = 'unknown';
  private statusHandlers: NetworkEventHandler[] = [];
  private connectHandlers: (() => void)[] = [];
  private disconnectHandlers: (() => void)[] = [];

  constructor() {
    // 假设有全局 native 网络事件总线
    if (typeof window !== 'undefined' && (window as any).NativeNetwork) {
      (window as any).NativeNetwork.onStatusChange((s: string) => this.handleStatusChange(s));
    }
  }
  getStatus(): NetworkStatus {
    return this.status;
  }
  isConnected(): boolean {
    return this.status === 'online' || this.status === 'limited' || this.status === 'slow';
  }
  onStatusChange(handler: NetworkEventHandler): void {
    this.statusHandlers.push(handler);
  }
  offStatusChange(handler: NetworkEventHandler): void {
    this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
  }
  onConnect(handler: () => void): void {
    this.connectHandlers.push(handler);
  }
  onDisconnect(handler: () => void): void {
    this.disconnectHandlers.push(handler);
  }
  offConnect(handler: () => void): void {
    this.connectHandlers = this.connectHandlers.filter(h => h !== handler);
  }
  offDisconnect(handler: () => void): void {
    this.disconnectHandlers = this.disconnectHandlers.filter(h => h !== handler);
  }
  simulateLatency(latencyMs: number): void {/* Native 端可选实现 */}
  simulateOffline(offline: boolean): void {/* Native 端可选实现 */}

  private handleStatusChange(s: string) {
    // s 可能为 'online'|'offline'|'limited'|'proxy'|'slow'|'unknown'
    const newStatus = (['online','offline','limited','proxy','slow','unknown'].includes(s) ? s : 'unknown') as NetworkStatus;
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusHandlers.forEach(h => h(this.status));
      if (newStatus === 'online') this.connectHandlers.forEach(h => h());
      if (newStatus === 'offline') this.disconnectHandlers.forEach(h => h());
    }
  }
}

// 创建适合当前环境的网络管理器
export function createNetworkManager(): NetworkManager {
  // TODO: 根据环境选择合适的网络管理器实现
  return new BrowserNetworkManager();
}
