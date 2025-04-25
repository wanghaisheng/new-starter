import { IDataService, DataServiceConfig, IMemoryCache } from '../types';
import { HybridDatabaseClient } from '../adapters/hybrid-database-client';
import { AdvancedHybridDatabaseClient } from '../adapters/advanced-hybrid-database-client';
import { MockHybridDatabaseClient } from '../adapters/mock-hybrid-database-client';
import { LoggerService } from '@/core/services/infrastructure/logger/service/logger-service';
import { configService } from '@/core/services/infrastructure/config';
import { parseEnum } from '@/core/services/infrastructure/config/parse-enum';
import type { ConfigSchema } from '@/core/services/infrastructure/config/config-types';
import { ClientRegistry } from '../adapters/client-registry';
import {
  DataMode,
  DbProvider,
  DbOrm,
  NodeEnv,
  EnvStage,
  // 如需其它枚举可继续引入
} from '@/core/lib/db/types/common';
import { getNetworkManager } from '@/core/services/infrastructure/network/registry/network-registry';
import { SyncManager } from '@/core/services/data/sync/sync-manager';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import { buildSyncManagerOptions } from './sync-manager-options-factory';
import type { BaseSyncClient } from '@/core/services/data/sync/base-sync-client';

function getDatabaseOptions(adapter: string): any {
  // 统一从配置服务获取所有数据服务相关变量
  switch (adapter) {
    case 'sqlite':
      return {
        name: configService.get('NEXT_PUBLIC_SQLITE_DB_NAME') || 'app.db',
        location: configService.get('NEXT_PUBLIC_SQLITE_DB_LOCATION'),
      };
    case 'indexeddb':
      return {
        dbName: configService.get('NEXT_PUBLIC_INDEXEDDB_NAME') || 'app-indexeddb',
      };
    default:
      return {};
  }
}

/**
 * 动态创建底层数据库 client（支持 provider + orm 组合）
 */
function createBaseClient(config: DataServiceConfig): IDataService<BaseEntity> {
  const provider = config.services.data.onlineProvider ?? 'unknown-provider';
  const orm = config.services.data.orm || 'native';
  if (!provider) {
    throw new Error('[DataServiceFactory] 缺少 provider 参数，无法创建底层 client');
  }
  if (!orm) {
    throw new Error('[DataServiceFactory] 缺少 orm 参数，无法创建底层 client');
  }
  const ClientClass = ClientRegistry.get(String(provider), String(orm));
  if (!ClientClass) {
    throw new Error(`[DataServiceFactory] 未注册的底层 client: provider=${provider}, orm=${orm}`);
  }
  return new ClientClass({ ...config, ...getDatabaseOptions(provider) });
}

/**
 * 根据配置自动判断同步场景并组装对应的 SyncClient
 * - memoryCache: 纯内存缓存（IMemoryCache 实现，需 provider=memory）
 * - offlineStore: 本地持久化存储（如 IndexedDB、SQLite）
 * - onlineClient: 远端数据库（如 Supabase、Firebase）
 *
 * 返回值类型兼容 IDataService<BaseEntity>，便于适配工厂主流程
 *
 * 支持场景：
 * 1. 高级多级缓存（memoryCache→offlineStore→onlineClient）
 * 2. 普通混合同步（offlineStore→onlineClient）
 * 3. 单一缓存/临时链路（仅 memory/redis/localstorage 等）
 * 4. 仅在线/仅离线
 */
function createSyncClientByConfig(config: DataServiceConfig): IDataService<BaseEntity> {
  const data = config.services?.data || {};
  const options = data.options || {};
  // 兼容 options 层与顶层 provider 字段
  const cacheProvider = data.options?.cacheProvider;
  const offlineProvider = data.options?.offlineProvider || options.offlineProvider;
  const onlineProvider = data.options?.onlineProvider || options.onlineProvider;
  const tempCacheProvider = data.options?.tempCacheProvider || options.tempCacheProvider;

  // 1. 高级多级缓存链路（memoryCache → offlineStore → onlineClient）
  if (cacheProvider && offlineProvider && onlineProvider) {
    // memoryCache 必须为 IMemoryCache 实现，需类型断言或类型保护
    const memoryCacheCandidate = createBaseClient({ ...config, services: { ...config.services, data: { ...data, onlineProvider: cacheProvider } } });
    if (!memoryCacheCandidate || typeof (memoryCacheCandidate as any).setCache !== 'function' || typeof (memoryCacheCandidate as any).getCache !== 'function') {
      throw new Error('[createSyncClientByConfig] memoryCache provider 必须实现 IMemoryCache 接口 (setCache/getCache/hasCache)');
    }
    const memoryCache = memoryCacheCandidate as unknown as IMemoryCache;
    const offlineStore = createBaseClient({ ...config, services: { ...config.services, data: { ...data, onlineProvider: offlineProvider } } });
    const onlineClient = createBaseClient({ ...config, services: { ...config.services, data: { ...data, onlineProvider } } });
    const networkManager = getNetworkManager();
    // 关键：SyncManager 必须用 services/data/sync/sync-manager 实现
    const syncManager = new SyncManager({
      client: offlineStore as any, // 需为 BaseSyncClient 实现
      entityTypes: config.services?.data?.entityTypes || [],
      networkManager,
      autoSyncOnConnect: options.autoSyncOnConnect,
      syncIntervalMs: options.syncIntervalMs,
      conflictResolver: options.conflictResolver,
      syncPriorityFn: options.syncPriorityFn,
    });
    const cacheTTL = options.cacheTTL || 10 * 60 * 1000;
    return new AdvancedHybridDatabaseClient(
      config,
      memoryCache,
      offlineStore,
      onlineClient,
      syncManager,
      networkManager,
      cacheTTL,
      config.services?.data?.entityTypes || []
    );
  }

  // 2. 普通混合同步（offlineStore → onlineClient）
  if (offlineProvider && onlineProvider) {
    const offlineStore = createBaseClient({ ...config, services: { ...config.services, data: { ...data, onlineProvider: offlineProvider } } });
    const onlineClient = createBaseClient({ ...config, services: { ...config.services, data: { ...data, onlineProvider } } });
    return new HybridDatabaseClient(
      config,
      offlineStore,
      onlineClient
    );
  }

  // 3. 单一缓存/临时链路（memory/redis/localstorage/tempCache）
  if (cacheProvider) {
    return createBaseClient({ ...config, services: { ...config.services, data: { ...data, onlineProvider: cacheProvider } } });
  }
  if (tempCacheProvider) {
    return createBaseClient({ ...config, services: { ...config.services, data: { ...data, onlineProvider: tempCacheProvider } } });
  }

  // 4. 仅在线
  if (onlineProvider) {
    return createBaseClient({ ...config, services: { ...config.services, data: { ...data, onlineProvider } } });
  }

  // 5. 仅离线
  if (offlineProvider) {
    return createBaseClient({ ...config, services: { ...config.services, data: { ...data, onlineProvider: offlineProvider } } });
  }

  throw new Error('[createSyncClientByConfig] 无法根据配置推断同步链路，请检查 provider 配置（需至少指定 onlineProvider 或 offlineProvider）');
}

/**
 * 数据服务工厂，根据环境变量/配置动态创建实例
 * DataMode 仅支持 online/offline/hybrid，特殊 hybrid 变体通过环境变量/配置推理
 */
export class DataServiceFactory {
  static createService(config: DataServiceConfig): IDataService<BaseEntity> {
    const logger = LoggerService.getInstance();
    const options = config.services.data.options || {};
    logger.info(`[DataServiceFactory] 创建数据服务，mode=${config.mode}, onlineProvider=${config.services.data.onlineProvider}, offlineProvider=${config.services.data.offlineProvider}, orm=${config.services.data.orm}`);

    // mock hybrid: 测试/演练环境优先
    const isMock = options.enableMock === true
      || process.env.NODE_ENV === 'test'
      || process.env.NEXT_PUBLIC_AUTH_TYPE === 'mock'
      || process.env.NEXT_PUBLIC_USER_SERVICE_TYPE === 'mock';
    if (isMock) {
      return new MockHybridDatabaseClient(config);
    }

    // hybrid/advanced-hybrid
    if (config.mode === 'hybrid') {
      const offlineConfig = {
        ...config,
        services: {
          ...config.services,
          data: {
            ...config.services.data,
            offlineProvider: config.services.data.offlineProvider || 'indexeddb',
            options: { ...options }
          }
        }
      };
      const onlineConfig = {
        ...config,
        services: {
          ...config.services,
          data: {
            ...config.services.data,
            onlineProvider: config.services.data.onlineProvider || 'sqlite',
            options: { ...options }
          }
        }
      };
      // 判断是否启用高级 hybrid
      const isAdvancedHybrid = options.cacheStrategy === 'memory'
        || options.cacheStrategy === 'redis'
        || options.cacheLayers?.includes('memory')
        || options.cacheLayers?.includes('redis')
        || options.syncStrategy === 'interval'
        || options.conflictDetection === true
        || options.distributed === true
        || options.failoverStrategy === 'auto'
        || process.env.CACHE_STRATEGY === 'memory'
        || process.env.CACHE_STRATEGY === 'redis'
        || process.env.ADVANCED_HYBRID === 'true';
      if (isAdvancedHybrid) {
        // 工厂负责实例化所有底层 client 和管理器，全部通过 createBaseClient 保证一致性
        const syncClient = createSyncClientByConfig(config);
        const networkManager = getNetworkManager();
        // === 新方式：根据 provider 组合与配置，自动推断同步链路，生成 SyncManagerOptions ===
        // ⚠️ 仅当 syncClient 为 BaseSyncClient 类型时才注入，否则跳过同步管理器注入
        let syncManager: SyncManager | undefined = undefined;
        if (syncClient && typeof (syncClient as any).syncEntities === 'function') {
          const syncManagerOptions = buildSyncManagerOptions(config, syncClient as any, networkManager);
          syncManager = new SyncManager(syncManagerOptions);
        }
        // 读取 cacheProvider，支持环境变量/配置驱动
        const cacheTTL = options.cacheTTL || 10 * 60 * 1000;
        // === 新注入方式：将 client 实例直接传递给高级混合适配器/同步适配器 ===
        // syncClient 是已实例化的 client，只有实现 IMemoryCache 时才允许注入 memoryCache
        if (
          syncClient &&
          typeof (syncClient as any).setCache === 'function' &&
          typeof (syncClient as any).getCache === 'function' &&
          typeof (syncClient as any).hasCache === 'function'
        ) {
          // 既支持 IMemoryCache 也支持 IDataService<BaseEntity>
          if (!syncManager) throw new Error('[createService] memory-only 高级混合链路必须提供 syncManager');
          return new AdvancedHybridDatabaseClient(
            config,
            syncClient as unknown as IMemoryCache,
            syncClient as IDataService<BaseEntity>,
            syncClient as IDataService<BaseEntity>,
            syncManager,
            networkManager,
            cacheTTL,
            config.services?.data?.entityTypes || []
          );
        }
        // fallback: 只作为普通 hybrid client
        return new HybridDatabaseClient(config, createBaseClient(offlineConfig), createBaseClient(onlineConfig));
      }
      return new HybridDatabaseClient(config, createBaseClient(offlineConfig), createBaseClient(onlineConfig));
    }

    // 单一 provider 场景（online/offline）
    return createBaseClient(config);
  }
}
