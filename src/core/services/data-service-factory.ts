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
  private static useHybrid: boolean = false;

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
          // 当useHybrid为true时，会使用混合数据库客户端
          // 这由DatabaseService内部处理，因为它会检查环境变量
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
   * 设置是否使用混合数据库客户端
   * 
   * @param useHybrid 是否使用混合客户端
   */
  public static setUseHybridClient(useHybrid: boolean): void {
    // 只有在实例未创建前可以更改设置
    if (!DataServiceFactory.instance) {
      DataServiceFactory.useHybrid = useHybrid;
      // 将设置保存到环境变量中，使DatabaseService可以访问
      if (typeof process !== 'undefined' && process.env) {
        process.env.NEXT_PUBLIC_USE_HYBRID_CLIENT = useHybrid ? 'true' : 'false';
      }
    } else {
      console.warn('Cannot change database client type after it has been initialized');
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
   * 获取数据服务实例
   * 与getDataService方法相同，提供兼容性支持
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
   */
  public static getHybridService(): IDataService {
    // 保存当前设置
    const currentHybridSetting = DataServiceFactory.useHybrid;
    
    try {
      // 临时强制使用混合客户端
      DataServiceFactory.setUseHybridClient(true);
      
      // 重置当前实例，以便下次获取时创建新实例
      DataServiceFactory.resetDataService();
      
      // 获取使用混合客户端的服务实例
      return DataServiceFactory.getDataService();
    } finally {
      // 恢复原始设置，但不重置实例，因为我们已经创建了一个
      DataServiceFactory.useHybrid = currentHybridSetting;
    }
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