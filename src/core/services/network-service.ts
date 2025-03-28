import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export class NetworkService {
  private static instance: NetworkService;
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus = {
    connected: true,
    connectionType: 'unknown'
  };

  private constructor() {
    this.initialize();
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  private async initialize() {
    if (Capacitor.isNativePlatform()) {
      // 在移动设备上使用Capacitor Network API
      Network.addListener('networkStatusChange', (status) => {
        this.currentStatus = status;
        this.notifyListeners();
      });
      
      // 获取初始网络状态
      this.currentStatus = await Network.getStatus();
    } else {
      // 在浏览器中使用标准的网络事件
      window.addEventListener('online', () => {
        this.currentStatus.connected = true;
        this.notifyListeners();
      });
      
      window.addEventListener('offline', () => {
        this.currentStatus.connected = false;
        this.notifyListeners();
      });
      
      // 获取初始网络状态
      this.currentStatus.connected = navigator.onLine;
    }
  }

  public onNetworkStatusChange(callback: (status: NetworkStatus) => void) {
    this.listeners.push(callback);
    // 立即通知当前状态
    callback(this.currentStatus);
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getCurrentStatus(): NetworkStatus {
    return this.currentStatus;
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.currentStatus);
    }
  }
}