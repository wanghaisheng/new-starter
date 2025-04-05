import { DatabaseConfig, DatabaseEngine } from '@/core/lib/db/types/database.types';

/**
 * 数据库配置构建器
 * 使用构建器模式创建和管理数据库配置
 */
class DatabaseConfigBuilder {
  private config: DatabaseConfig = {
    name: 'app_database',
    version: 1,
    engine: 'sqlite',
    tables: {},
    offline: {
      maxStorageSize: 50 * 1024 * 1024, // 50MB
      maxEntitiesPerTable: 10000,
      compressionEnabled: true,
      encryptionEnabled: true
    }
  };

  /**
   * 设置数据库名称
   */
  withName(name: string): this {
    this.config.name = name;
    return this;
  }

  /**
   * 设置数据库版本
   */
  withVersion(version: number): this {
    this.config.version = version;
    return this;
  }

  /**
   * 设置数据库引擎
   */
  withEngine(engine: DatabaseEngine): this {
    this.config.engine = engine;
    return this;
  }

  /**
   * 设置同步配置
   */
  withSync(syncConfig: NonNullable<DatabaseConfig['sync']>): this {
    this.config.sync = { ...syncConfig };
    return this;
  }

  /**
   * 设置离线存储配置
   */
  withOfflineStorage(offlineConfig: NonNullable<DatabaseConfig['offline']>): this {
    this.config.offline = { ...offlineConfig };
    return this;
  }

  /**
   * 设置表结构
   */
  withTables(tables: DatabaseConfig['tables']): this {
    this.config.tables = { ...tables };
    return this;
  }

  /**
   * 设置加密密钥
   */
  withEncryptionKey(key: string): this {
    this.config.encryptionKey = key;
    return this;
  }

  /**
   * 构建最终配置
   */
  build(): DatabaseConfig {
    return { ...this.config };
  }
}

// 基础配置
const baseConfig: Partial<DatabaseConfig> = {
  version: 1,
  offline: {
    maxStorageSize: 50 * 1024 * 1024, // 50MB
    maxEntitiesPerTable: 10000,
    compressionEnabled: true,
    encryptionEnabled: true
  },
  tables: {}
};

// 环境特定配置
const environments: Record<string, DatabaseConfig> = {
  development: {
    ...baseConfig as DatabaseConfig,
    name: 'app_database_dev',
    engine: 'mock',
    // 开发环境同步配置
    sync: {
      enabled: true,
      strategy: 'manual',
      offlineOnly: false,
      interval: 60000, // 每分钟同步一次
      retryAttempts: 3,
      conflictResolution: 'client-wins'
    }
  },
  test: {
    ...baseConfig as DatabaseConfig,
    name: 'app_database_test',
    engine: 'mock-indexeddb',
    // 测试环境同步配置
    sync: {
      enabled: true,
      strategy: 'immediate',
      offlineOnly: false
    }
  },
  production: {
    ...baseConfig as DatabaseConfig,
    name: 'app_database',
    engine: 'sqlite',
    // 生产环境同步配置
    sync: {
      enabled: true,
      strategy: 'periodic',
      interval: 300000, // 每5分钟同步一次
      retryAttempts: 5,
      retryDelay: 10000, // 10秒后重试
      conflictResolution: 'last-write-wins'
    }
  }
};

// 确定当前环境
const getEnvironment = (): string => {
  // 优先使用环境变量
  if (typeof process !== 'undefined' && process.env) {
    // 从环境变量获取
    if (process.env.NEXT_PUBLIC_DATABASE_ENV) {
      return process.env.NEXT_PUBLIC_DATABASE_ENV;
    }
    
    // 从 NODE_ENV 获取
    if (process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }
  }
  
  // 默认为开发环境
  return 'development';
};

const env = getEnvironment();

// 导出当前环境的配置
export const config: DatabaseConfig = environments[env] || environments.development;

// 导出配置构建器供自定义配置使用
export const configBuilder = new DatabaseConfigBuilder();

// 导出创建特定配置的函数
export function createConfig(options: Partial<DatabaseConfig> = {}): DatabaseConfig {
  return {
    ...config,
    ...options
  };
} 