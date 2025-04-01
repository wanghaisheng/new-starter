import { Capacitor } from '@capacitor/core';
import { DatabaseService } from './database-service';
import { MockDataService } from './mock-data-service';
import { IDataService } from './data-service.interface';

export class DataServiceFactory {
  private static instance: IDataService;

  public static getInstance(): IDataService {
    if (!DataServiceFactory.instance) {
      const databaseEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
      
      switch (databaseEnv) {
        case 'mock':
          DataServiceFactory.instance = MockDataService.getInstance();
          break;
        case 'local':
          // 在移动平台使用 SQLite
          if (Capacitor.isNativePlatform()) {
            DataServiceFactory.instance = DatabaseService.getInstance();
          } else {
            // 在 Web 平台使用 IndexedDB
            DataServiceFactory.instance = MockDataService.getInstance();
          }
          break;
        case 'cloud':
          // TODO: 实现云端数据库服务
          DataServiceFactory.instance = MockDataService.getInstance();
          break;
        default:
          throw new Error(`Unsupported database environment: ${databaseEnv}`);
      }
    }
    return DataServiceFactory.instance;
  }
}