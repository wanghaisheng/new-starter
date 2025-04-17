export interface NetworkStatus {
  connected: boolean;
  type?: 'wifi' | 'cellular' | 'ethernet' | 'none';
}

export interface NetworkStatusListener {
  (status: NetworkStatus): void;
}

export class NetworkService {
  private static instance: NetworkService;
  private statusListeners: NetworkStatusListener[] = [];
  private currentStatus: NetworkStatus = { connected: false };

  private constructor() {
    // 初始化网络状态监听
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.updateStatus({ connected: true }));
      window.addEventListener('offline', () => this.updateStatus({ connected: false }));
      this.updateStatus({ connected: navigator.onLine });
    }
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  public isOnline(): boolean {
    return this.currentStatus.connected;
  }

  public getConnectionStatus(): 'online' | 'offline' {
    return this.currentStatus.connected ? 'online' : 'offline';
  }

  public addNetworkStatusListener(listener: NetworkStatusListener): () => void {
    this.statusListeners.push(listener);
    // 立即通知当前状态
    listener(this.currentStatus);
    // 返回移除监听器的函数
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private updateStatus(status: NetworkStatus): void {
    this.currentStatus = status;
    this.statusListeners.forEach(listener => listener(status));
  }
} 