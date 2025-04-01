import { NetworkStatus } from '@capacitor/network';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

/**
 * 网络服务接口
 * 定义网络服务应提供的方法
 */
export interface INetworkService {
  initialize(): Promise<void>;
  isOnline(): boolean;
  getNetworkStatus(): NetworkStatus;
  addNetworkStatusListener(listener: (status: NetworkStatus) => void): string;
  removeNetworkStatusListener(listenerId: string): void;
  setOfflineMode(offline: boolean): void;
}

/**
 * 网络服务
 * 提供网络状态监测和管理功能
 */
export class NetworkService implements INetworkService {
  private static instance: NetworkService;
  private networkStatus: NetworkStatus = { connected: false, connectionType: 'none' };
  private networkListeners: Map<string, (status: NetworkStatus) => void> = new Map();
  private initialized: boolean = false;
  private forceOfflineMode: boolean = false;

  private constructor() {}

  /**
   * 获取NetworkService的单例
   * @returns NetworkService实例
   */
  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  /**
   * 初始化网络服务
   * 获取当前网络状态并设置网络变化监听器
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        // 在移动设备上使用Capacitor Network API
        this.networkStatus = await Network.getStatus();
        
        // 监听网络状态变化
        Network.addListener('networkStatusChange', (status) => {
          this.updateNetworkStatus(status);
        });
      } else {
        // 在浏览器环境中使用浏览器的网络API
        this.networkStatus = {
          connected: navigator.onLine,
          connectionType: navigator.onLine ? 'wifi' : 'none'
        };
        
        // 监听浏览器的在线/离线事件
        window.addEventListener('online', () => {
          this.updateNetworkStatus({
            connected: true,
            connectionType: 'wifi'
          });
        });
        
        window.addEventListener('offline', () => {
          this.updateNetworkStatus({
            connected: false,
            connectionType: 'none'
          });
        });
      }

      console.log('NetworkService initialized, current status:', this.networkStatus);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize NetworkService:', error);
      // 如果初始化失败，假设离线状态
      this.networkStatus = { connected: false, connectionType: 'none' };
    }
  }

  /**
   * 检查是否在线
   * @returns 是否连接到网络
   */
  public isOnline(): boolean {
    // 如果强制离线模式已启用，始终返回false
    if (this.forceOfflineMode) {
      return false;
    }
    return this.networkStatus.connected;
  }

  /**
   * 获取当前网络状态
   * @returns 网络状态对象
   */
  public getNetworkStatus(): NetworkStatus {
    // 如果强制离线模式已启用，返回离线状态
    if (this.forceOfflineMode) {
      return { connected: false, connectionType: 'none' };
    }
    return { ...this.networkStatus };
  }

  /**
   * 添加网络状态变化监听器
   * @param listener 监听器函数
   * @returns 监听器ID
   */
  public addNetworkStatusListener(listener: (status: NetworkStatus) => void): string {
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.networkListeners.set(listenerId, listener);
    
    // 立即通知新监听器当前状态
    listener(this.getNetworkStatus());
    
    return listenerId;
  }

  /**
   * 移除网络状态变化监听器
   * @param listenerId 监听器ID
   */
  public removeNetworkStatusListener(listenerId: string): void {
    this.networkListeners.delete(listenerId);
  }

  /**
   * 设置强制离线模式
   * 用于测试或特定场景下模拟离线状态
   * @param offline 是否启用强制离线模式
   */
  public setOfflineMode(offline: boolean): void {
    if (this.forceOfflineMode !== offline) {
      this.forceOfflineMode = offline;
      
      // 通知所有监听器网络状态变化
      this.notifyListeners();
      
      console.log(`Force offline mode ${offline ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * 更新网络状态并通知监听器
   * @param status 新的网络状态
   */
  private updateNetworkStatus(status: NetworkStatus): void {
    const previouslyConnected = this.networkStatus.connected;
    this.networkStatus = status;
    
    // 如果连接状态改变，记录到控制台
    if (previouslyConnected !== status.connected) {
      console.log(`Network is now ${status.connected ? 'online' : 'offline'}`);
    }
    
    // 通知所有监听器
    this.notifyListeners();
  }

  /**
   * 通知所有监听器网络状态变化
   */
  private notifyListeners(): void {
    const status = this.getNetworkStatus();
    this.networkListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }
}