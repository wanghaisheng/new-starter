import type { DataServiceConfig } from '../types';
import type { BaseSyncClient } from '@/core/services/data/sync/base-sync-client';
import type { NetworkManager } from '@/core/services/infrastructure/network/network-manager';
import type { SyncManagerOptions, SyncConflictResolver, SyncPriorityFn } from '@/core/services/data/sync/sync-manager';

/**
 * 工厂函数：根据 DataServiceConfig 及 provider 组合动态生成 SyncManagerOptions
 * 支持多级缓存、链路推断、同步策略、冲突解决、优先级等能力
 */
export function buildSyncManagerOptions(
  config: DataServiceConfig,
  syncClient: BaseSyncClient,
  networkManager: NetworkManager
): SyncManagerOptions {
  const options = config.services?.data?.options || {};
  const dataServices = config.services?.data || {};

  // 解析 provider 类型，兼容 options 和 dataServices 两处
  const cacheProvider = options.cacheProvider || (dataServices as any).cacheProvider || 'memory';
  const tempCacheProvider = options.tempCacheProvider || (dataServices as any).tempCacheProvider;
  const offlineProvider = dataServices.offlineProvider || 'indexeddb';
  const onlineProvider = dataServices.onlineProvider || 'rest';
  // mode 只从 config 或 options 中读取，避免 TS 报错
  const mode = config.mode || options.mode || 'HYBRID';

  // 动态调整同步参数，支持字符串与数字类型
  let entityTypes = options.entityTypes;
  let syncIntervalMs = typeof options.syncInterval === 'string' ? parseInt(options.syncInterval, 10) : (options.syncInterval || 10 * 60 * 1000);
  let autoSyncOnConnect: boolean | undefined = undefined;
  if (typeof options.autoSync === 'string') {
    autoSyncOnConnect = options.autoSync === 'true';
  } else if (typeof options.autoSync === 'boolean') {
    autoSyncOnConnect = options.autoSync;
  } else {
    autoSyncOnConnect = true;
  }

  // 冲突解决与优先级策略
  let conflictResolver: SyncConflictResolver | undefined = options.conflictResolver;
  let syncPriorityFn: SyncPriorityFn | undefined = options.syncPriorityFn;

  // provider 组合智能推断与高级能力
  // 1. 多级缓存场景：memoryCache/临时cache → offline → online
  if (cacheProvider && offlineProvider && onlineProvider && mode === 'HYBRID') {
    // memory+offline+online 三层链路，建议更短同步间隔
    syncIntervalMs = Math.min(syncIntervalMs, 2 * 60 * 1000);
    // 可根据业务场景注入更复杂的优先级/冲突策略
    if (!syncPriorityFn && typeof entityTypes === 'object' && Array.isArray(entityTypes)) {
      syncPriorityFn = (collection, allTypes) => {
        // 例：重要表优先
        const important = ['users', 'orders'];
        return important.concat(allTypes.filter(t => !important.includes(t)));
      };
    }
  }

  // 2. cache-to-cache 场景
  if (cacheProvider === 'memory' && mode === 'HYBRID') {
    // 多端广播/订阅，建议更短同步间隔
    syncIntervalMs = Math.min(syncIntervalMs, 60 * 1000);
  }

  // 3. 仅离线/仅在线场景
  if (mode === 'OFFLINE' && offlineProvider) {
    syncIntervalMs = Math.max(syncIntervalMs, 10 * 60 * 1000);
  }
  if (mode === 'ONLINE' && onlineProvider) {
    autoSyncOnConnect = false;
  }

  // 4. 业务自定义扩展
  // 支持通过 options 注入自定义 flush、onProgress、onConflict 等事件钩子

  return {
    client: syncClient,
    entityTypes,
    networkManager,
    autoSyncOnConnect,
    syncIntervalMs,
    conflictResolver,
    syncPriorityFn,
    // ...后续如需扩展更多高级参数，可在此补充
  };
}
