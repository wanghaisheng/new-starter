import { IDataService } from './data-service-interface';
import { DatabaseService } from './database-service';
import { MockDataService } from './mock-data-service';
import { OfflineStorageService } from './offline-storage-service';

/**
 * 数据服务工厂类
 * 
 * 根据环境和配置创建适当的数据服务实例
 */
export class DataServiceFactory {
  private static instance: IDataService | null = null;
  private static useMock: boolean = false;

  /**
   * 获取数据服务实例
   * 
   * 根据当前环境和配置返回适当的数据服务实例
   * @returns 数据服务实例
   */
  public static getDataService(): IDataService {
    if (!DataServiceFactory.instance) {
      try {
        // 根据环境变量或其他配置决定使用哪种数据服务
        if (DataServiceFactory.useMock || process.env.REACT_APP_USE_MOCK_DATA === 'true') {
          console.log('Using MockDataService for data operations');
          // 我们使用类型断言，因为我们知道这些服务已经实现了IDataService接口
          const mockService = MockDataService.getInstance();
          DataServiceFactory.instance = mockService as unknown as IDataService;
        } else {
          console.log('Using DatabaseService for data operations');
          const dbService = DatabaseService.getInstance();
          DataServiceFactory.instance = dbService as unknown as IDataService;
        }
      } catch (error) {
        console.error('Error initializing data service:', error);
        throw new Error('Failed to initialize data service');
      }
    }
    
    return DataServiceFactory.instance;
  }

  /**
   * 设置是否使用模拟数据服务
   * 
   * @param useMock 是否使用模拟数据
   */
  public static setUseMockData(useMock: boolean): void {
    // 只有在实例未创建前可以更改设置
    if (!DataServiceFactory.instance) {
      DataServiceFactory.useMock = useMock;
    } else {
      console.warn('Cannot change data service type after it has been initialized');
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
   */
  public static getOfflineStorageService(): OfflineStorageService {
    return OfflineStorageService.getInstance();
  }
  
  /**
   * 获取离线模式的数据服务
   * 强制使用本地数据库，忽略环境设置
   */
  public static getOfflineModeService(): IDataService {
    const dbService = DatabaseService.getInstance();
    return dbService as unknown as IDataService;
  }
  
  /**
   * 初始化所有服务
   * 用于应用启动时预初始化
   */
  public static async initializeAll(): Promise<void> {
    try {
      // 初始化数据服务
      const dataService = this.getDataService();
      await dataService.initialize();
      
      // 初始化离线存储服务
      const offlineService = this.getOfflineStorageService();
      await offlineService.initialize();
      
      console.log('All data services successfully initialized');
    } catch (error) {
      console.error('Failed to initialize data services:', error);
      throw new Error('Service initialization failed');
    }
  }
}