/**
 * Firebase 离线模式管理器
 * 管理 Firebase 的在线/离线状态和数据同步
 */

import { 
  Firestore, 
  enableMultiTabIndexedDbPersistence, 
  enableIndexedDbPersistence,
  waitForPendingWrites,
  disableNetwork,
  enableNetwork,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { DatabaseLogger, getLogger } from '@/core/lib/db/errors/database-logger';

/**
 * 离线管理器配置选项
 */
export interface OfflineManagerOptions {
  /**
   * 是否启用持久化
   * @default true
   */
  enablePersistence?: boolean;
  
  /**
   * 是否启用多标签页支持
   * 允许在多个浏览器标签中使用同一数据库实例
   * @default true
   */
  multiTabSupport?: boolean;
  
  /**
   * 网络连接状态变化回调
   * @param isOnline 是否在线
   */
  onNetworkStateChanged?: (isOnline: boolean) => void;
  
  /**
   * 同步状态变化回调
   * @param isSyncing 是否正在同步
   */
  onSyncStateChanged?: (isSyncing: boolean) => void;
}

/**
 * Firebase 离线模式管理器
 * 负责处理 Firebase 的在线/离线状态转换和数据同步
 */
export class FirebaseOfflineManager {
  private logger: DatabaseLogger;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private persistenceEnabled: boolean = false;
  private options: Required<OfflineManagerOptions>;
  
  /**
   * 创建离线模式管理器实例
   * @param db Firestore 实例
   * @param options 配置选项
   */
  constructor(private db: Firestore, options: OfflineManagerOptions = {}) {
    this.logger = getLogger('FirebaseOfflineManager');
    
    // 设置默认选项
    this.options = {
      enablePersistence: options.enablePersistence !== false,
      multiTabSupport: options.multiTabSupport !== false,
      onNetworkStateChanged: options.onNetworkStateChanged || (() => {}),
      onSyncStateChanged: options.onSyncStateChanged || (() => {})
    };
    
    // 初始化时监听网络状态
    this.setupNetworkListeners();
  }
  
  /**
   * 初始化离线支持
   * 配置缓存策略并启用持久化
   */
  public async initialize(): Promise<void> {
    try {
      if (!this.options.enablePersistence) {
        this.logger.info('离线持久化已禁用');
        return;
      }
      
      this.logger.info('正在初始化 Firebase 离线支持...');
      
      // 尝试启用持久化
      if (this.options.multiTabSupport) {
        await enableMultiTabIndexedDbPersistence(this.db);
        this.logger.info('已启用多标签页持久化');
      } else {
        await enableIndexedDbPersistence(this.db);
        this.logger.info('已启用单标签页持久化');
      }
      
      this.persistenceEnabled = true;
    } catch (error) {
      this.logger.error('初始化离线支持失败', error);
      
      // 特定错误处理
      if (error instanceof Error) {
        if (error.name === 'FirebaseError' && error.message.includes('already exists')) {
          this.logger.warn('多标签页持久化失败，可能是另一个标签页已经初始化了持久化');
          this.persistenceEnabled = true; // 持久化已经被其他标签页启用
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  
  /**
   * 设置网络状态监听器
   */
  private setupNetworkListeners(): void {
    // 浏览器在线/离线状态监听
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // 初始状态
      this.isOnline = navigator.onLine;
      this.logger.debug(`初始网络状态: ${this.isOnline ? '在线' : '离线'}`);
    }
  }
  
  /**
   * 处理设备上线事件
   */
  private handleOnline = async (): Promise<void> => {
    if (!this.isOnline) {
      this.isOnline = true;
      this.logger.info('网络已连接');
      
      try {
        // 重新启用网络
        await this.enableNetworkConnection();
        
        // 触发回调
        this.options.onNetworkStateChanged(true);
      } catch (error) {
        this.logger.error('启用网络连接失败', error);
      }
    }
  };
  
  /**
   * 处理设备离线事件
   */
  private handleOffline = async (): Promise<void> => {
    if (this.isOnline) {
      this.isOnline = false;
      this.logger.info('网络已断开');
      
      try {
        // 禁用网络连接
        await this.disableNetworkConnection();
        
        // 触发回调
        this.options.onNetworkStateChanged(false);
      } catch (error) {
        this.logger.error('禁用网络连接失败', error);
      }
    }
  };
  
  /**
   * 手动切换到离线模式
   */
  public async goOffline(): Promise<void> {
    if (this.isOnline) {
      this.logger.info('手动切换到离线模式');
      await this.disableNetworkConnection();
      this.isOnline = false;
      this.options.onNetworkStateChanged(false);
    }
  }
  
  /**
   * 手动切换到在线模式
   */
  public async goOnline(): Promise<void> {
    if (!this.isOnline) {
      this.logger.info('手动切换到在线模式');
      await this.enableNetworkConnection();
      this.isOnline = true;
      this.options.onNetworkStateChanged(true);
    }
  }
  
  /**
   * 禁用网络连接
   */
  private async disableNetworkConnection(): Promise<void> {
    try {
      await disableNetwork(this.db);
      this.logger.info('已禁用网络连接');
    } catch (error) {
      this.logger.error('禁用网络连接失败', error);
      throw error;
    }
  }
  
  /**
   * 启用网络连接
   */
  private async enableNetworkConnection(): Promise<void> {
    try {
      this.isSyncing = true;
      this.options.onSyncStateChanged(true);
      
      await enableNetwork(this.db);
      this.logger.info('已启用网络连接');
      
      // 等待挂起的写入操作完成
      await this.waitForPendingWrites();
      
      this.isSyncing = false;
      this.options.onSyncStateChanged(false);
    } catch (error) {
      this.isSyncing = false;
      this.options.onSyncStateChanged(false);
      this.logger.error('启用网络连接失败', error);
      throw error;
    }
  }
  
  /**
   * 等待所有挂起的写入操作完成
   */
  public async waitForPendingWrites(): Promise<void> {
    try {
      this.logger.debug('等待挂起的写入操作完成...');
      await waitForPendingWrites(this.db);
      this.logger.info('所有挂起的写入操作已完成');
    } catch (error) {
      this.logger.error('等待挂起的写入操作失败', error);
      throw error;
    }
  }
  
  /**
   * 获取当前在线状态
   * @returns 是否在线
   */
  public isNetworkOnline(): boolean {
    return this.isOnline;
  }
  
  /**
   * 获取当前同步状态
   * @returns 是否正在同步
   */
  public isSynchronizing(): boolean {
    return this.isSyncing;
  }
  
  /**
   * 获取持久化状态
   * @returns 持久化是否已启用
   */
  public isPersistenceEnabled(): boolean {
    return this.persistenceEnabled;
  }
  
  /**
   * 清理资源
   */
  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    this.logger.info('已移除网络状态监听器');
  }
} 