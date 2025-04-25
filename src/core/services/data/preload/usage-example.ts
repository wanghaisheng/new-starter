import { HybridDatabaseClient } from '../adapters/hybrid-database-client';
import { DataPreloadService } from './data-preload-service';
import { DataPreloadConfig } from './types';

// mock IDataService<BaseEntity> 实现，仅用于演示
const dummyClient = {
  async query(table: string, opts: any) { return []; },
  async get() { return null; },
  async set() {},
  async findOne() { return null; },
  async insert() { return {}; },
  async update() {},
  async delete() {},
  async clear() {},
  async dispose() {},
  getType() { return 'dummy'; },
  isInitialized() { return true; },
  getConfig() { return {}; },
  initialize: async () => {},
} as any;

// 示例 DataServiceConfig
const config = {
  mode: 'hybrid',
  services: {
    data: {
      onlineProvider: 'dummy',
      offlineProvider: 'dummy',
      options: {}
    }
  }
} as any;

// 正确初始化 HybridDatabaseClient
const hybrid = new HybridDatabaseClient(config, dummyClient, dummyClient);

// 配置需要预加载的表和参数
const preloadConfig: DataPreloadConfig = {
  enabled: true,
  preloadTables: ['users', 'messages', 'matches'],
  maxRecordsPerTable: 20,
  autoPreloadInterval: 5 * 60 * 1000,
  cacheTTL: 15 * 60 * 1000,
  cacheKeyPrefix: 'preload_'
};

// 初始化 DataPreloadService
const preloadService = DataPreloadService.getInstance(hybrid, preloadConfig);

// 手动触发预加载
preloadService.preloadAll();

// 在业务代码中获取预加载数据
const users = preloadService.getCachedData('users');
const messages = preloadService.getCachedData('messages');

// 可监听状态或定时刷新页面数据
console.log('users status:', preloadService.getStatus('users'));

// --- 如需广播一致性功能，建议在实际业务入口处统一注入 cacheBroadcastAdapter ---
// 例如：在工厂或主入口初始化 cacheBroadcastAdapter 并传递给所有相关服务
// 具体事件类型和处理逻辑可根据业务自定义