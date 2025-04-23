import { IDataService, DataServiceConfig } from '../types';
import { SqliteDatabaseClient } from '../adapters/sqlite-database-client';
import { IndexedDBDatabaseClient } from '../adapters/indexeddb-database-client';
// 自动引入 mock 实现
import { MockHybridDatabaseClient } from '../adapters/mock-hybrid-database-client';
import { LoggerService } from '@/core/services/infrastructure/logger/service/logger-service';
import { configService } from '@/core/services/infrastructure/config';

function getEnvAdapter(): DataServiceConfig['services']['data']['adapter'] {
  // 优先使用环境变量，否则 fallback 到 mock
  const dbEnv = configService.get('NEXT_PUBLIC_DATABASE_ENV');
  if (dbEnv === 'sqlite') return 'sqlite';
  if (dbEnv === 'indexeddb') return 'indexeddb';
  if (dbEnv === 'mock') return 'mock';
  // 可扩展更多环境变量
  return 'mock';
}

export class DataServiceFactory {
  /**
   * 创建数据服务实例，支持动态环境切换和日志追踪
   */
  static createService(config?: DataServiceConfig): IDataService {
    const logger = LoggerService.getInstance();
    let adapter: DataServiceConfig['services']['data']['adapter'];
    let options: any = {};
    if (config && config.services && config.services.data) {
      adapter = config.services.data.adapter;
      options = config.services.data.options || {};
      logger.info(`[DataServiceFactory] 使用传入配置创建数据服务，adapter=${adapter}`);
    } else {
      // 自动推断环境
      adapter = getEnvAdapter();
      logger.info(`[DataServiceFactory] 未传入配置，自动推断 adapter=${adapter}`);
    }
    switch (adapter) {
      case 'sqlite':
        logger.info('[DataServiceFactory] 实例化 SqliteDatabaseClient');
        return new SqliteDatabaseClient(options.sqlite || {});
      case 'indexeddb':
        logger.info('[DataServiceFactory] 实例化 IndexedDBDatabaseClient');
        return new IndexedDBDatabaseClient(options.indexeddb || {});
      case 'mock':
        logger.info('[DataServiceFactory] 实例化 MockHybridDatabaseClient');
        return new MockHybridDatabaseClient(options.mock || {});
      // case 'firebase':
      //   logger.info('[DataServiceFactory] 实例化 FirebaseDataService');
      //   return new FirebaseDataService(...);
      // case 'drizzle':
      //   logger.info('[DataServiceFactory] 实例化 DrizzleDataService');
      //   return new DrizzleDataService(...);
      default:
        logger.error(`[DataServiceFactory] 不支持的 adapter 类型: ${adapter}`);
        throw new Error(`Unsupported adapter type: ${adapter}`);
    }
  }
}
