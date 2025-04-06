import { IDataService } from './data-service-interface';
import { DatabaseService } from './database-service';
import { MockDataService } from './mock-data-service';
import { OfflineStorageService } from './offline-storage-service';
import { Capacitor } from '@capacitor/core';

// 检查是否在浏览器环境中运行
const isBrowser = typeof window !== 'undefined';
// 检查是否在服务器环境中运行
const isServer = typeof process !== 'undefined' && process.versions?.node;
// 检查是否在原生环境中运行
const isNative = Capacitor.isNativePlatform();

/**
 * 数据服务工厂类
 * 
 * 根据环境和配置创建适当的数据服务实例
 */
export class DataServiceFactory {
  private static instance: IDataService | null = null;
  private static useMock: boolean = false;
  private static useHybrid: boolean = false;

  /**
   * 获取数据服务实例
   * 
   * 根据当前环境和配置返回适当的数据服务实例
   * @returns 数据服务实例
   * @throws Error 如果服务初始化失败
   */
  public static getDataService(): IDataService {
    if (!DataServiceFactory.instance) {
      try {
        // 获取环境配置
        const dbEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
        const mockDbType = process.env.NEXT_PUBLIC_MOCK_DB_TYPE || 'memory';
        const useFakeIndexedDB = process.env.NEXT_PUBLIC_USE_FAKE_INDEXEDDB === 'true';
        const jsonFilePath = process.env.NEXT_PUBLIC_MOCK_DB_JSON_PATH;
        const autoSave = process.env.NEXT_PUBLIC_MOCK_DB_AUTO_SAVE === 'true';

        // 检查是否使用Mock数据
        const shouldUseMock = DataServiceFactory.useMock || dbEnv === 'mock';

        if (shouldUseMock || (isBrowser && !isNative)) {
          // 在浏览器环境中使用Mock服务
          console.log(`Using MockDataService with ${mockDbType} storage${useFakeIndexedDB ? ' and fake-indexeddb' : ''}`);
          
          DataServiceFactory.instance = MockDataService.getInstance({
            mockMode: mockDbType as 'memory' | 'json',
            jsonFilePath,
            autoSave
          });
        } else if (isNative) {
          // 在原生环境中使用Capacitor SQLite
          console.log('Using Capacitor SQLite for data storage');
          DataServiceFactory.instance = DatabaseService.getInstance();
        } else if (dbEnv === 'local') {
          // 在本地环境中使用IndexedDB
          console.log('Using IndexedDB for data storage');
          DataServiceFactory.instance = DatabaseService.getInstance();
        } else {
          // 在生产环境中使用生产数据库
          console.log('Using production database service');
          DataServiceFactory.instance = DatabaseService.getInstance();
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error initializing data service:', errorMessage);
        throw new Error(`Failed to initialize data service: ${errorMessage}`);
      }
    }
    
    if (!DataServiceFactory.instance) {
      throw new Error('Data service instance is null after initialization');
    }
    
    return DataServiceFactory.instance;
  }

  /**
   * 设置是否使用模拟数据服务
   * 
   * @param useMock 是否使用模拟数据
   * @throws Error 如果尝试在服务初始化后更改设置
   */
  public static setUseMockData(useMock: boolean): void {
    if (!DataServiceFactory.instance) {
      DataServiceFactory.useMock = useMock;
    } else {
      throw new Error('Cannot change data service type after it has been initialized');
    }
  }

  /**
   * 设置是否使用混合数据库客户端
   * 
   * @param useHybrid 是否使用混合客户端
   * @throws Error 如果尝试在服务初始化后更改设置
   */
  public static setUseHybridClient(useHybrid: boolean): void {
    if (!DataServiceFactory.instance) {
      DataServiceFactory.useHybrid = useHybrid;
      if (typeof process !== 'undefined' && process.env) {
        process.env.NEXT_PUBLIC_USE_HYBRID_CLIENT = useHybrid ? 'true' : 'false';
      }
    } else {
      throw new Error('Cannot change database client type after it has been initialized');
    }
  }

  /**
   * 重置数据服务实例
   * 
   * 清除当前实例，下次调用getDataService时将创建新实例
   */
  public static resetDataService(): void {
    DataServiceFactory.instance = null;
  }

  /**
   * 获取离线存储服务实例
   * 专门用于处理离线专用数据
   * 
   * @returns 离线存储服务实例
   */
  public static getOfflineStorageService(): OfflineStorageService {
    return OfflineStorageService.getInstance();
  }
  
  /**
   * 获取离线模式的数据服务
   * 强制使用本地数据库，忽略环境设置
   * 
   * @returns 离线模式数据服务实例
   */
  public static getOfflineModeService(): IDataService {
    return DatabaseService.getInstance();
  }
  
  /**
   * 获取数据服务实例
   * 与getDataService方法相同，提供兼容性支持
   * 
   * @returns 数据服务实例
   */
  public static getInstance(): IDataService {
    return this.getDataService();
  }

  /**
   * 获取混合数据库服务实例
   * 强制使用混合数据库客户端，无论环境设置如何
   * 
   * @returns 混合数据库服务实例
   * @throws Error 如果服务初始化失败
   */
  public static getHybridService(): IDataService {
    const currentHybridSetting = DataServiceFactory.useHybrid;
    
    try {
      DataServiceFactory.setUseHybridClient(true);
      DataServiceFactory.resetDataService();
      return DataServiceFactory.getDataService();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to initialize hybrid service: ${errorMessage}`);
    } finally {
      DataServiceFactory.useHybrid = currentHybridSetting;
    }
  }

  /**
   * 初始化所有服务
   * 用于应用启动时预初始化
   * 
   * @throws Error 如果任何服务初始化失败
   */
  public static async initializeAll(): Promise<void> {
    try {
      const dataService = this.getDataService();
      const offlineService = this.getOfflineStorageService();

      // 并行初始化服务以提高性能
      await Promise.all([
        dataService.initialize(),
        offlineService.initialize()
      ]);

      console.log('All data services successfully initialized');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to initialize data services:', errorMessage);
      throw new Error(`Service initialization failed: ${errorMessage}`);
    }
  }
}