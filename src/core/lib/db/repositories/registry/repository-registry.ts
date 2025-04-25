/**
 * 仓储注册表：集中注册与获取所有仓储实例，支持多实现/多环境自动切换
 */
import { getConfigService } from '@/core/services/infrastructure/config/registry/config-registry';
import { getLoggerService } from '@/core/services/infrastructure/logger/registry/logger-registry';
import { DataMode } from '@/core/lib/db/types/database';
// 如有更多实体仓储，依次引入

// 自动注册所有适配器工厂（由脚本自动生成，保证所有实体适配器都被 import 并注册）
import '../factory/auto-register-adapters';
// 自动引入 RepositoryMap 类型声明（由脚本自动生成，保证类型安全）
import { RepositoryKey, RepositoryMap } from './repository-map';

function parseDataMode(modeStr?: string): DataMode {
  switch (modeStr) {
    case 'offline':
    case 'offline-only':
      return DataMode.OFFLINE;
    case 'online':
    case 'online-only':
      return DataMode.ONLINE;
    case 'hybrid':
      return DataMode.HYBRID;
    default:
      return DataMode.ONLINE;
  }
}

class RepositoryRegistry {
  private registry = new Map<RepositoryKey, any>();
  private configService: ReturnType<typeof getConfigService>;
  private logger: ReturnType<typeof getLoggerService>;

  constructor(configService?: ReturnType<typeof getConfigService>, logger?: ReturnType<typeof getLoggerService>) {
    // 支持注入或默认全局单例
    this.configService = configService || getConfigService();
    this.logger = logger || getLoggerService();
  }

  /** 注册仓储实例 */
  register<K extends RepositoryKey>(key: K, instance: RepositoryMap[K]) {
    this.registry.set(key, instance);
    this.logger.info(`[RepositoryRegistry] Registered repository: ${key}`);
  }

  /** 获取仓储实例 */
  get<K extends RepositoryKey>(key: K): RepositoryMap[K] {
    const repo = this.registry.get(key);
    if (!repo) {
      this.logger.error(`[RepositoryRegistry] Repository not registered: ${key}`);
      throw new Error(`Repository not registered: ${key}`);
    }
    this.logger.debug(`[RepositoryRegistry] Get repository: ${key}`);
    return repo;
  }

  /**
   * 通用自动注册仓储（支持所有实体/多数据源，按环境变量/配置自动切换）
   */
  autoRegisterRepository(entityKey: string, options: {
    envStage?: string;
    dataMode?: DataMode;
    platform?: string;
    configService?: ReturnType<typeof getConfigService>;
    clientMap?: {
      indexeddb?: any;
      sqlite?: any;
      supabase?: any;
      mock?: any;
      default?: any;
    };
  }) {
    const config = options?.configService || this.configService;
    const logger = this.logger;
    const env = options?.envStage || config.get('ENV_STAGE') || process.env.ENV_STAGE || 'local';
    const mode = options?.dataMode ?? parseDataMode(config.get('DATA_MODE') || process.env.DATA_MODE);
    const platform = options?.platform || config.get('PLATFORM') || process.env.PLATFORM || 'web';
    logger.info(`[RepositoryRegistry] Auto register ${entityKey} repository, env=${env}, mode=${mode}, platform=${platform}`);

    // 优先 mock
    if (env === 'mock' || mode === DataMode.OFFLINE) {
      try {
        const MockRepoClass = require(`../impl/${entityKey}-mock-repository`).default;
        this.register(entityKey as any, new MockRepoClass(options?.clientMap?.mock));
        logger.info(`[RepositoryRegistry] Registered ${entityKey} MockRepository`);
        return;
      } catch (e) {
        logger.warn(`[RepositoryRegistry] No mock repository found for ${entityKey}`);
      }
    }
    // web IndexedDB
    if (platform === 'web' && options?.clientMap?.indexeddb) {
      const factory = require('../factory/repository-factory').RepositoryFactoryRegistry.getFactory(`${entityKey}-indexeddb`);
      if (factory) {
        this.register(entityKey as any, factory({ client: options.clientMap.indexeddb }));
        logger.info(`[RepositoryRegistry] Registered ${entityKey} IndexedDBRepository`);
        return;
      }
    }
    // mobile SQLite
    if (platform === 'mobile' && options?.clientMap?.sqlite) {
      const factory = require('../factory/repository-factory').RepositoryFactoryRegistry.getFactory(`${entityKey}-sqlite`);
      if (factory) {
        this.register(entityKey as any, factory({ client: options.clientMap.sqlite }));
        logger.info(`[RepositoryRegistry] Registered ${entityKey} SQLiteRepository`);
        return;
      }
    }
    // cloud Supabase
    if (platform === 'cloud' && options?.clientMap?.supabase) {
      const factory = require('../factory/repository-factory').RepositoryFactoryRegistry.getFactory(`${entityKey}-supabase`);
      if (factory) {
        this.register(entityKey as any, factory({ client: options.clientMap.supabase }));
        logger.info(`[RepositoryRegistry] Registered ${entityKey} SupabaseRepository`);
        return;
      }
    }
    // fallback: 默认真实实现
    try {
      const RepoClass = require(`../impl/${entityKey}-repository`).default;
      this.register(entityKey as any, new RepoClass(options?.clientMap?.default));
      logger.info(`[RepositoryRegistry] Registered default ${entityKey} Repository`);
    } catch (e) {
      logger.error(`[RepositoryRegistry] No default repository found for ${entityKey}`);
    }
  }

  /**
   * 批量自动注册所有仓储（自动遍历所有实体 key，优先支持数据服务自动注入，类型安全）
   * options: 支持 clientMap、envStage、dataMode、platform、configService、logger
   * 推荐统一调用本方法，自动完成所有仓储与数据服务的注册与解耦
   */
  autoRegisterAll(options: {
    envStage?: string;
    dataMode?: DataMode;
    platform?: string;
    configService?: ReturnType<typeof getConfigService>;
    clientMap?: Partial<RepositoryMap>;
    logger?: any;
  } = {}) {
    // 动态引入数据服务注册表，避免循环依赖
    const { DataServiceRegistry } = require('@/core/services/data/registry/data-service-registry');
    const dataService = DataServiceRegistry.get('default');
    // 获取所有已注册实体 key（类型断言保证类型安全）
    const keys = require('../factory/repository-factory').RepositoryFactoryRegistry.getAvailableKeys() as RepositoryKey[];
    for (const key of keys) {
      const factory = require('../factory/repository-factory').RepositoryFactoryRegistry.getFactory(key);
      // 优先 clientMap，其次统一 dataService
      const client = (options.clientMap as Partial<Record<RepositoryKey, any>>)?.[key] || dataService;
      if (factory && client) {
        this.register(key, factory({ client }));
      } else {
        (options.logger || this.logger).warn?.(`[RepositoryRegistry] autoRegisterAll: factory/client missing for key '${key}'`);
      }
    }
    (options.logger || this.logger).info?.(`[RepositoryRegistry] All repositories auto-registered: ${keys.join(', ')}`);
  }

  /**
   * 清空所有已注册仓储（便于测试/热重载）
   */
  clear() {
    this.registry.clear();
    this.logger.info('[RepositoryRegistry] Cleared all registered repositories');
  }

  // 可扩展 autoRegisterXxxRepository
}

export const repositoryRegistry = new RepositoryRegistry();

// 推荐在应用启动或入口处统一注册
// repositoryRegistry.autoRegisterAll({ envStage: 'mock', clientMap: { user: ... }, configService, logger });
