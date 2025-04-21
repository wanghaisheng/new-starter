import { IDataService, DataServiceConfig } from '../types';
import { SqliteDatabaseClient } from '../adapters/sqlite-database-client';
import { IndexedDBDatabaseClient } from '../adapters/indexeddb-database-client';
// 自动引入 mock 实现
import { MockHybridDatabaseClient } from '../examples/mock-hybrid-database-client';

function getEnvAdapter(): DataServiceConfig['services']['data']['adapter'] {
  // 优先使用环境变量，否则 fallback 到 mock
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_DATABASE_ENV === 'sqlite') return 'sqlite';
    if (process.env.NEXT_PUBLIC_DATABASE_ENV === 'indexeddb') return 'indexeddb';
    if (process.env.NEXT_PUBLIC_DATABASE_ENV === 'mock') return 'mock';
    // 可扩展更多环境变量
  }
  return 'mock';
}

export class DataServiceFactory {
  static createService(config?: DataServiceConfig): IDataService {
    let adapter: DataServiceConfig['services']['data']['adapter'];
    let options: any = {};
    if (config && config.services && config.services.data) {
      adapter = config.services.data.adapter;
      options = config.services.data.options || {};
    } else {
      // 自动推断环境
      adapter = getEnvAdapter();
    }
    switch (adapter) {
      case 'sqlite':
        return new SqliteDatabaseClient(options.sqlite || {});
      case 'indexeddb':
        return new IndexedDBDatabaseClient(options.indexeddb || {});
      case 'mock':
        return new MockHybridDatabaseClient(options.mock || {});
      // case 'firebase':
      //   return new FirebaseDataService(...);
      // case 'drizzle':
      //   return new DrizzleDataService(...);
      default:
        throw new Error(`Unsupported adapter type: ${adapter}`);
    }
  }
}
