import { SyncManager } from '@/core/lib/db/sync/sync-manager';
import { DatabaseService } from './database-service';
import { NetworkService } from './network-service';
import { OfflineStorageService } from './offline-storage-service';
import { DataServiceFactory } from './data-service-factory';
import { DatabaseFactory } from '@/core/lib/db/factory';
import { SyncPriority, ConflictResolution } from '@/core/lib/db/types/sync-flags';
import { DatabaseClient } from '@/core/lib/db/types/database.types';

/**
 * 应用服务
 * 负责管理应用的初始化、服务集成和全局状态
 */
export class AppService {
  private static instance: AppService;
  private initialized: boolean = false;
  private syncManager: SyncManager | null = null;
  private dbClient: DatabaseClient | null = null;
  
  private constructor() {}
  
  public static getInstance(): AppService {
    if (!AppService.instance) {
      AppService.instance = new AppService();
    }
    return AppService.instance;
  }
  
  /**
   * 初始化应用
   * 设置并启动所有必要的服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('AppService already initialized');
      return;
    }
    
    try {
      console.log('Initializing AppService...');
      
      // 初始化数据库和存储服务
      await this.initializeStorage();
      
      // 初始化网络服务
      this.initializeNetwork();
      
      // 初始化同步服务
      await this.initializeSync();
      
      // 设置完成
      this.initialized = true;
      console.log('AppService initialization complete');
      
    } catch (error) {
      console.error('Failed to initialize AppService:', error);
      throw error;
    }
  }
  
  /**
   * 初始化数据存储服务
   */
  private async initializeStorage(): Promise<void> {
    try {
      console.log('Initializing storage services...');
      
      // 确保数据库客户端已创建
      const dbClient = DatabaseFactory.createClientFromEnv() as unknown as DatabaseClient;
      await dbClient.initialize();
      this.dbClient = dbClient;
      
      // 初始化数据服务
      await DataServiceFactory.initializeAll();
      
      console.log('Storage services initialized');
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }
  
  /**
   * 初始化网络服务
   */
  private initializeNetwork(): void {
    try {
      console.log('Initializing network service...');
      
      const networkService = NetworkService.getInstance();
      
      // 读取用户设置，如果用户已开启离线模式则应用
      const offlineModeSetting = localStorage.getItem('offlineMode');
      const offlineMode = offlineModeSetting === 'true';
      
      if (offlineMode) {
        console.log('Enabling offline mode from user settings');
        networkService.enableOfflineMode(true);
      }
      
      console.log('Network service initialized');
    } catch (error) {
      console.error('Failed to initialize network:', error);
      throw error;
    }
  }
  
  /**
   * 初始化同步服务
   */
  private async initializeSync(): Promise<void> {
    if (!this.dbClient) {
      console.error('数据库客户端未初始化，无法设置同步管理器');
      return;
    }
    
    try {
      console.log('Initializing sync service...');
      
      const networkService = NetworkService.getInstance();
      const canSync = networkService.canSync();
      
      // 创建同步管理器实例
      this.syncManager = new SyncManager({
        client: this.dbClient,
        networkManager: networkService,
        entityTypes: ['users', 'matches', 'messages'],
        autoSyncOnConnect: true,
        defaultConfig: {
          enabled: canSync,
          defaultPriority: SyncPriority.MEDIUM,
          defaultConflictResolution: ConflictResolution.SERVER_WINS,
          syncInterval: 60000,
          maxRetries: 5,
          retryDelay: 30000,
          batchSize: 50,
          retentionAfterDelete: 604800000
        }
      });
      
      // 当网络连接状态改变时更新同步策略
      networkService.onConnect(() => {
        this.onNetworkConnected();
      });
      
      networkService.onDisconnect(() => {
        this.onNetworkDisconnected();
      });
      
      // 初始化同步队列，如果网络可用，执行一次同步
      if (canSync && this.syncManager) {
        await this.syncManager.sync();
      }
      
      console.log('Sync service initialized');
    } catch (error) {
      console.error('Failed to initialize sync:', error);
      throw error;
    }
  }
  
  /**
   * 网络连接时执行的操作
   */
  private onNetworkConnected(): void {
    console.log('Network connected');
    
    // 通知用户网络已恢复
    this.notifyUser('网络已连接', '你现在处于在线模式');
    
    // 尝试执行同步操作
    this.syncData();
  }
  
  /**
   * 网络断开时执行的操作
   */
  private onNetworkDisconnected(): void {
    console.log('Network disconnected');
    
    // 通知用户网络已断开
    this.notifyUser('网络已断开', '你现在处于离线模式');
  }
  
  /**
   * 同步数据
   */
  private async syncData(): Promise<void> {
    try {
      const networkService = NetworkService.getInstance();
      
      if (this.syncManager && networkService.canSync()) {
        // 执行同步
        await this.syncManager.sync();
      }
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  }
  
  /**
   * 通知用户
   * 简单实现，实际应用中可以使用通知服务
   */
  private notifyUser(title: string, message: string): void {
    console.log(`Notification: ${title} - ${message}`);
    // 实际应用中可以调用通知服务展示给用户
  }
  
  /**
   * 切换离线模式
   */
  public toggleOfflineMode(enable: boolean): void {
    const networkService = NetworkService.getInstance();
    networkService.enableOfflineMode(enable);
    
    // 保存用户设置
    localStorage.setItem('offlineMode', enable.toString());
    
    // 通知用户
    const message = enable 
      ? '你已开启离线模式，数据仅存储在本地，不会与服务器同步' 
      : '你已关闭离线模式，数据将与服务器同步';
      
    this.notifyUser('离线模式', message);
  }
  
  /**
   * 检查是否处于离线模式
   */
  public isOfflineMode(): boolean {
    const networkService = NetworkService.getInstance();
    return networkService.isOfflineMode();
  }
  
  /**
   * 获取离线存储服务
   * 用于处理离线专用数据
   */
  public getOfflineStorage(): OfflineStorageService {
    return OfflineStorageService.getInstance();
  }
  
  /**
   * 手动触发同步
   */
  public async triggerSync(): Promise<boolean> {
    try {
      const networkService = NetworkService.getInstance();
      
      if (!networkService.canSync()) {
        this.notifyUser('同步失败', '无法同步，你当前处于离线模式或网络未连接');
        return false;
      }
      
      await this.syncData();
      this.notifyUser('同步完成', '数据已成功同步到服务器');
      return true;
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      this.notifyUser('同步失败', '发生错误，无法完成同步');
      return false;
    }
  }
} 