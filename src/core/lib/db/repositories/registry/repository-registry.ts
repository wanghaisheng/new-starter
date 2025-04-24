/**
 * 仓储注册表：集中注册与获取所有仓储实例，支持多实现/多环境自动切换
 */
import { getConfigService } from '@/core/services/infrastructure/config/registry/config-registry';
import { getLoggerService } from '@/core/services/infrastructure/logger/registry/logger-registry';
// 如有更多实体仓储，依次引入

// 自动注册所有适配器工厂（由脚本自动生成，保证所有实体适配器都被 import 并注册）
import '../factory/auto-register-adapters';
// 自动引入 RepositoryMap 类型声明（由脚本自动生成，保证类型安全）
import { RepositoryKey, RepositoryMap } from './repository-map';

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
    dataMode?: string;
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
    const mode = options?.dataMode || config.get('DATA_MODE') || process.env.DATA_MODE || 'online-only';
    const platform = options?.platform || config.get('PLATFORM') || process.env.PLATFORM || 'web';
    logger.info(`[RepositoryRegistry] Auto register ${entityKey} repository, env=${env}, mode=${mode}, platform=${platform}`);

    // 优先 mock
    if (env === 'mock' || mode === 'offline-mock') {
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
   * 批量自动注册所有仓储（自动遍历所有实体 key）
   * options: 传递 clientMap、envStage、dataMode、platform 等参数
   */
  autoRegisterAll(options: {
    envStage?: string;
    dataMode?: string;
    platform?: string;
    configService?: ReturnType<typeof getConfigService>;
    clientMap?: {
      [key: string]: any;
    };
  }) {
    // 维护所有实体 key 列表（可自动生成或手动维护）
    const entityKeys: string[] = ['user']; // 后续补充 'photo', 'match', ...
    for (const key of entityKeys) {
      this.autoRegisterRepository(key, {
        ...options,
        clientMap: options.clientMap || {},
      });
    }
    this.logger.info(`[RepositoryRegistry] All repositories auto-registered: ${entityKeys.join(', ')}`);
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
