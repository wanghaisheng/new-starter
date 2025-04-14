import { IDataService } from './data-service';
import { MockDataService } from './mock-data-service';
import { SqliteDataService } from './sqlite-data-service';
import { PostgresDataService } from './postgres-data-service';
import { OfflineStorageService } from './offline-storage-service';
import { DatabaseConfig, defaultConfig } from '@/core/lib/db/config';
import { logger } from '@/core/lib/logger';

export class DataServiceFactory {
  private static instance: IDataService | null = null;
  private static offlineService: OfflineStorageService | null = null;
  private static config: DatabaseConfig = defaultConfig;
  private static isInitialized = false;

  static setConfig(config: Partial<DatabaseConfig>): void {
    this.config = { ...defaultConfig, ...config };
  }

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 初始化在线存储服务
      switch (this.config.storage.online.type) {
        case 'mock':
          this.instance = new MockDataService({
            mockMode: 'memory',
            loadDemoData: this.config.testData.loadOnStartup,
            demoDataSource: this.config.testData.source
          });
          break;
        case 'sqlite':
          this.instance = new SqliteDataService(this.config.storage.online.connection);
          break;
        case 'postgres':
          this.instance = new PostgresDataService(this.config.storage.online.connection);
          break;
        default:
          throw new Error(`Unsupported online storage type: ${this.config.storage.online.type}`);
      }

      // 初始化离线存储服务（如果启用）
      if (this.config.env.enableOffline) {
        this.offlineService = new OfflineStorageService({
          type: this.config.storage.offline.type,
          options: this.config.storage.offline.options
        });
        await this.offlineService.initialize();
      }

      // 初始化主服务
      await this.instance.initialize();
      this.isInitialized = true;

      logger.info('Data services initialized', {
        environment: this.config.env.environment,
        onlineStorage: this.config.storage.online.type,
        offlineEnabled: this.config.env.enableOffline,
        offlineStorage: this.config.storage.offline.type
      });
    } catch (error) {
      logger.error('Failed to initialize data services', { error });
      throw error;
    }
  }

  static getDataService(): IDataService {
    if (!this.instance) {
      throw new Error('DataService not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  static getOfflineService(): OfflineStorageService | null {
    return this.offlineService;
  }

  static async reloadTestData(): Promise<void> {
    const service = this.getDataService();
    if (service instanceof MockDataService) {
      await service.loadDemoData();
    } else {
      // 对于其他数据服务，实现相应的测试数据加载逻辑
      await service.clearAll();
      // TODO: 实现测试数据加载
    }
  }
}