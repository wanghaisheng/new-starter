import { HybridDatabaseClient } from '../adapters/hybrid-database-client';
import { DataPreloadService } from '../preload/data-preload-service';
import { DataPreloadConfig } from '../preload/types';

// 1. 初始化 HybridDatabaseClient
const hybrid = new HybridDatabaseClient({ /* mock/config */ });

// 2. 配置 DataPreloadService
const preloadConfig: DataPreloadConfig = {
  enabled: true,
  preloadTables: [
    { name: 'users', maxRecords: 10, priority: 1 },
    { name: 'messages', maxRecords: 20, cacheTTL: 5 * 60 * 1000, priority: 2, dependsOn: ['users'] },
    'logs'
  ],
  autoPreloadInterval: 2 * 60 * 1000,
  cacheTTL: 10 * 60 * 1000,
  preloadOnNetworkReconnect: true
};

const preloadService = DataPreloadService.getInstance(hybrid, preloadConfig);

// 3. 事件监听（模拟 UI 层交互）
preloadService.on('preload:start', ({ table }) => console.log(`[UI] 开始预加载: ${table}`));
preloadService.on('preload:success', ({ table, data }) => console.log(`[UI] 预加载成功: ${table}, 共${data.length}条`));
preloadService.on('preload:error', ({ table, error }) => console.error(`[UI] 预加载失败: ${table}`, error));
preloadService.on('cache:expired', ({ table }) => console.warn(`[UI] 缓存过期: ${table}`));
preloadService.on('network:online', () => console.info('[UI] 网络恢复，自动预加载'));
preloadService.on('network:offline', () => console.info('[UI] 网络断开'));

// 4. 主动刷新/清理缓存
setTimeout(() => {
  preloadService.refreshCache('users');
  preloadService.clearCache('logs');
}, 5000);

// 5. 获取缓存与状态
setTimeout(() => {
  const users = preloadService.getCachedData('users');
  const status = preloadService.getStatus('users');
  console.log('[UI] users 缓存:', users, '状态:', status);
}, 10000);

// 6. 状态管理集成点
preloadService.onCacheUpdate = (table, data) => {
  // 模拟同步到全局状态
  console.log(`[UI] 状态管理同步: ${table} 数据量=${data.length}`);
};

// 7. 业务入口触发一次全量预加载
preloadService.preloadAll();
