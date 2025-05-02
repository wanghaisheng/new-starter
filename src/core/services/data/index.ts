// data/index.ts
import { DataServiceRegistry } from './registry/data-service-registry';
import { DataServiceFactory } from './factory/data-service-factory';
import { DataPreloadService } from './preload/data-preload-service';
import { DataMigrationService } from './migration/data-migration-service';
import { parseEnum } from '../infrastructure/config/parse-enum';
import { getConfigService } from '@/core/services/infrastructure/config';
import { getLoggerService } from '@/core/services/infrastructure/logger';
import type { IDataService } from './types';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';
import type { DataServiceConfig } from './types';
import { DataMode, DbProvider, DbOrm } from '@/core/lib/db/types/common';

// 全局单例实例
let dataService: IDataService<BaseEntity> | undefined;
let dataPreloadService: DataPreloadService | undefined;
let dataMigrationService: DataMigrationService | undefined;

/**
 * 数据服务类型枚举
 */
export enum DataServiceType {
  DEFAULT = 'default',
  MOCK = 'mock',
  HYBRID = 'hybrid',
  ONLINE = 'online',
  OFFLINE = 'offline',
  MEMORY = 'memory',
  SQLITE = 'sqlite',
  INDEXEDDB = 'indexeddb',
  REST = 'rest',
  GRAPHQL = 'graphql',
}

/**
 * 异步初始化数据服务
 * 用法：await initDataService();
 */
export async function initDataService(serviceType?: DataServiceType) {
  const logger = getLoggerService();
  logger.info('[DataService] 初始化数据服务...');
  
  try {
    // 从配置服务获取数据服务类型（如果有）
    const configService = getConfigService();
    const resolvedServiceType = serviceType || 
                              configService.get('NEXT_PUBLIC_DATA_SERVICE_TYPE') ||
                              configService.get('DATA_SERVICE_TYPE') ||
                              DataServiceType.DEFAULT;
    
    // 解析数据服务模式
    const dataMode = parseEnum(
      DataMode,
      configService.get('NEXT_PUBLIC_DATA_MODE') || configService.get('DATA_MODE'),
      DataMode.HYBRID,
      'initDataService'
    );
    const envStage = configService.get('NEXT_PUBLIC_ENV_STAGE');
    // 解析在线和离线提供者
    const onlineProvider = parseEnum(
      DbProvider,
      configService.get('NEXT_PUBLIC_ONLINE_PROVIDER') || configService.get('ONLINE_PROVIDER'),
      DbProvider.REST,
      'initDataService'
    );
    
    const offlineProvider = parseEnum(
      DbProvider,
      configService.get('NEXT_PUBLIC_OFFLINE_PROVIDER') || configService.get('OFFLINE_PROVIDER'),
      DbProvider.INDEXEDDB,
      'initDataService'
    );
    
    // 解析ORM类型
    const orm = parseEnum(
      DbOrm,
      configService.get('NEXT_PUBLIC_DB_ORM') || configService.get('DB_ORM'),
      DbOrm.NATIVE,
      'initDataService'
    );
    
    // 构建数据服务配置
    const dataServiceConfig: DataServiceConfig = {
      mode: dataMode,
      envStage: envStage,

      services: {
        data: {
          onlineProvider,
          offlineProvider,
          orm,
          options: {
            cacheTTL: Number(configService.get('NEXT_PUBLIC_CACHE_TTL') || 600000),
            autoSyncOnConnect: configService.get('NEXT_PUBLIC_AUTO_SYNC') !== 'false',
            syncIntervalMs: Number(configService.get('NEXT_PUBLIC_SYNC_INTERVAL') || 300000),
            enableMock: configService.get('NEXT_PUBLIC_ENABLE_MOCK_DATA') === 'true',
            cacheStrategy: configService.get('NEXT_PUBLIC_CACHE_STRATEGY'),
            entityTypes: configService.get('NEXT_PUBLIC_ENTITY_TYPES')?.split(',') || [],
          }
        }
      }
    };
    
    // 通过工厂方法创建数据服务实例（自动选择适配器/来源）
    dataService = DataServiceFactory.createService(dataServiceConfig);
    
    // 初始化数据服务
    if (dataService && typeof dataService.initialize === 'function') {
      await dataService.initialize();
    }
    
    // 初始化数据预加载服务（如果配置启用）
    if (configService.get('NEXT_PUBLIC_ENABLE_DATA_PRELOAD') === 'true') {
      await initDataPreloadService(dataService);
    }
    
    logger.info('[DataService] 数据服务初始化完成');
    return { dataService };
  } catch (error) {
    logger.error('[DataService] 数据服务初始化失败', error);
    throw error;
  }
}

/**
 * 初始化数据预加载服务
 */
async function initDataPreloadService(service: IDataService<BaseEntity>) {
  const logger = getLoggerService();
  try {
    const configService = getConfigService();
    // 确保service是HybridDatabaseClient类型
    if (service && typeof (service as any).query === 'function') {
      const preloadConfig = {
        enabled: true,
        autoPreloadInterval: Number(configService.get('NEXT_PUBLIC_PRELOAD_INTERVAL') || 300000),
        preloadOnNetworkReconnect: configService.get('NEXT_PUBLIC_PRELOAD_ON_RECONNECT') !== 'false',
        cacheTTL: Number(configService.get('NEXT_PUBLIC_PRELOAD_CACHE_TTL') || 600000),
        maxRecordsPerTable: Number(configService.get('NEXT_PUBLIC_PRELOAD_MAX_RECORDS') || 100),
        maxCacheTables: Number(configService.get('NEXT_PUBLIC_PRELOAD_MAX_TABLES') || 20),
        preloadTables: configService.get('NEXT_PUBLIC_PRELOAD_TABLES')?.split(',') || []
      };
      
      dataPreloadService = DataPreloadService.getInstance(service as any, preloadConfig);
      await dataPreloadService.preloadAll();
      logger.info('[DataService] 数据预加载服务初始化完成');
    }
  } catch (error) {
    logger.error('[DataService] 数据预加载服务初始化失败', error);
  }
}

/**
 * 初始化数据迁移服务
 */
export async function initDataMigrationService(source: any, target: any, config: any) {
  const logger = getLoggerService();
  try {
    dataMigrationService = new DataMigrationService({
      source,
      target,
      tables: config.tables,
      batchSize: config.batchSize || 50,
      resumable: config.resumable !== false,
      maxRetry: config.maxRetry || 3,
      verify: config.verify !== false,
      concurrency: config.concurrency || 1,
      onLog: config.onLog,
      onGlobalProgress: config.onGlobalProgress
    });
    logger.info('[DataService] 数据迁移服务初始化完成');
    return dataMigrationService;
  } catch (error) {
    logger.error('[DataService] 数据迁移服务初始化失败', error);
    throw error;
  }
}

/**
 * 获取已初始化的数据服务
 * 若未初始化会抛出异常
 */
export function getDataService(): IDataService<BaseEntity> {
  if (!dataService) {
    // 调试：打印调用栈，定位谁在 initDataService 前调用
    console.error('[DEBUG] getDataService called before initDataService');
    console.error(new Error('[DEBUG] getDataService stack trace').stack);
    throw new Error('DataService not initialized, call initDataService() first.');
  }
  return dataService;
}

/**
 * 获取已初始化的数据预加载服务
 */
export function getDataPreloadService(): DataPreloadService | undefined {
  return dataPreloadService;
}

/**
 * 获取已初始化的数据迁移服务
 */
export function getDataMigrationService(): DataMigrationService | undefined {
  return dataMigrationService;
}

/**
 * （可选）测试环境重置，避免污染
 */
export function resetDataService() {
  dataService = undefined;
  dataPreloadService = undefined;
  dataMigrationService = undefined;
}