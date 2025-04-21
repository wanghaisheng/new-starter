import { HybridDatabaseClient } from '../adapters/hybrid-database-client';
import { DataPreloadService } from './data-preload-service';
import { DataPreloadConfig } from './types';

// 初始化 HybridDatabaseClient
const hybrid = new HybridDatabaseClient({ /* 可配置 adapter 选项 */ });

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
