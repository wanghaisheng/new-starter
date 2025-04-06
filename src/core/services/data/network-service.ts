import { NetworkStatus } from '@capacitor/network';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { NetworkManager, NetworkEventHandler } from '@/core/lib/network/network-manager';

/**
 * 连接状态枚举
 */
export type ConnectionStatus = 'online' | 'offline' | 'limited';

/**
 * 同步状态
 */
export type SyncStatus = 'syncing' | 'synced' | 'error' | 'waiting';

/**
 * 同步状态详情
 */
export interface SyncDetails {
  pending: number;
  completed: number;
  failed: number;
}

/**
 * 同步状态监听器
 */
export type SyncStatusListener = (status: SyncStatus, details?: SyncDetails) => void;

/**
 * 网络状态监听器
 */
export type NetworkStatusListener = (status: NetworkStatus) => void;

/**
 * 网络服务接口
 */
export interface INetworkService {
  initialize(): Promise<void>;
  isOnline(): boolean;
  isConnected(): boolean;
  getNetworkStatus(): NetworkStatus;
  getConnectionStatus(): ConnectionStatus;
  getConnectionType(): string;
  addNetworkStatusListener(listener: NetworkStatusListener): string;
  removeNetworkStatusListener(listenerId: string): void;
  addSyncStatusListener(listener: SyncStatusListener): string;
  removeSyncStatusListener(listenerId: string): void;
  setOfflineMode(offline: boolean): void;
  enableOfflineMode(enable: boolean): void;
  isOfflineMode(): boolean;
  canSync(): boolean;
  simulateLatency(latencyMs: number): void;
  simulateOffline(offline: boolean): void;
}

/**
 * 网络服务
 * 提供网络状态监测和管理功能
 */
export class NetworkService implements INetworkService {
  private static instance: NetworkService;
  private networkStatus: NetworkStatus = { connected: false, connectionType: 'none' };
  private networkListeners: Map<string, NetworkStatusListener> = new Map();
  private syncStatusListeners: Map<string, SyncStatusListener> = new Map();
  private initialized: boolean = false;
  private forceOfflineMode: boolean = false;
  private latencyMs: number = 0;
  private currentSyncStatus: SyncStatus = 'synced';
  private syncDetails: SyncDetails = { pending: 0, completed: 0, failed: 0 };

  private constructor() {}

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        this.networkStatus = await Network.getStatus();
        Network.addListener('networkStatusChange', (status) => {
          this.updateNetworkStatus(status);
        });
      } else {
        this.networkStatus = {
          connected: navigator.onLine,
          connectionType: navigator.onLine ? 'wifi' : 'none'
        };
        
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

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize NetworkService:', error);
      this.networkStatus = { connected: false, connectionType: 'none' };
    }
  }

  public isOnline(): boolean {
    return !this.forceOfflineMode && this.networkStatus.connected;
  }

  public isConnected(): boolean {
    return this.isOnline();
  }

  public getNetworkStatus(): NetworkStatus {
    if (this.forceOfflineMode) {
      return { connected: false, connectionType: 'none' };
    }
    return { ...this.networkStatus };
  }

  public getConnectionStatus(): ConnectionStatus {
    if (this.forceOfflineMode) {
      return 'offline';
    }
    
    if (!this.networkStatus.connected) {
      return 'offline';
    }
    
    if (this.networkStatus.connectionType === 'cellular' || this.latencyMs > 1000) {
      return 'limited';
    }
    
    return 'online';
  }

  public getConnectionType(): string {
    if (this.forceOfflineMode) {
      return 'none';
    }
    return this.networkStatus.connectionType;
  }

  public addNetworkStatusListener(listener: NetworkStatusListener): string {
    const listenerId = Math.random().toString(36).substring(7);
    this.networkListeners.set(listenerId, listener);
    // 立即触发一次当前状态
    listener(this.getNetworkStatus());
    return listenerId;
  }

  public removeNetworkStatusListener(listenerId: string): void {
    this.networkListeners.delete(listenerId);
  }

  public addSyncStatusListener(listener: SyncStatusListener): string {
    const listenerId = Math.random().toString(36).substring(7);
    this.syncStatusListeners.set(listenerId, listener);
    // 立即触发一次当前状态
    listener(this.currentSyncStatus, this.syncDetails);
    return listenerId;
  }

  public removeSyncStatusListener(listenerId: string): void {
    this.syncStatusListeners.delete(listenerId);
  }

  public setOfflineMode(offline: boolean): void {
    this.forceOfflineMode = offline;
    this.notifyNetworkStatusChange();
  }

  public enableOfflineMode(enable: boolean): void {
    this.setOfflineMode(enable);
  }

  public isOfflineMode(): boolean {
    return this.forceOfflineMode;
  }

  public canSync(): boolean {
    return this.isOnline() && this.currentSyncStatus !== 'syncing';
  }

  public simulateLatency(latencyMs: number): void {
    this.latencyMs = latencyMs;
    this.notifyNetworkStatusChange();
  }

  public simulateOffline(offline: boolean): void {
    this.setOfflineMode(offline);
  }

  private updateNetworkStatus(status: NetworkStatus): void {
    this.networkStatus = status;
    this.notifyNetworkStatusChange();
  }

  private notifyNetworkStatusChange(): void {
    const status = this.getNetworkStatus();
    this.networkListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  private updateSyncStatus(status: SyncStatus, details?: SyncDetails): void {
    this.currentSyncStatus = status;
    if (details) {
      this.syncDetails = details;
    }
    this.notifySyncStatusChange();
  }

  private notifySyncStatusChange(): void {
    this.syncStatusListeners.forEach(listener => {
      try {
        listener(this.currentSyncStatus, this.syncDetails);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }
}