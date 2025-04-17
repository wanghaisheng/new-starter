import type { DatabaseConfig as DatabaseConfigType, DatabaseEngine } from '@/core/lib/db/types/database.types';

/**
 * 数据库配置构建器
 * 使用构建器模式创建和管理数据库配置
 */
class DatabaseConfigBuilder {
  private config: DatabaseConfigType = {
    name: 'app_database',
    version: 1,
    engine: 'sqlite',
    tables: {},
    offline: {
      maxStorageSize: 50 * 1024 * 1024, // 50MB
      maxEntitiesPerTable: 10000,
      compressionEnabled: true,
      encryptionEnabled: true
    },
    env: {
      environment: 'development',
      enableOffline: false,
      enableHybrid: false
    },
    storage: {
      online: {
        type: 'sqlite',
        connection: {}
      },
      offline: {
        type: 'indexeddb',
        connection: {}
      }
    },
    sync: {
      enabled: false,
      strategy: 'manual',
      conflictResolution: 'server-wins',
      syncIntervalMs: 0
    },
    testData: {
      loadOnStartup: false,
      source: 'example'
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
  withSync(syncConfig: NonNullable<DatabaseConfigType['sync']>): this {
    this.config.sync = { ...syncConfig };
    return this;
  }

  /**
   * 设置离线存储配置
   */
  withOfflineStorage(offlineConfig: NonNullable<DatabaseConfigType['offline']>): this {
    this.config.offline = { ...offlineConfig };
    return this;
  }

  /**
   * 设置表结构
   */
  withTables(tables: DatabaseConfigType['tables']): this {
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
  build(): DatabaseConfigType {
    return { ...this.config };
  }
}

// 基础配置
const baseConfig: Partial<DatabaseConfigType> = {
  engine: 'mock',
  name: 'app_database',
  version: 1,
  sync: {
    enabled: false,
    strategy: 'manual',
    conflictResolution: 'server-wins',
    syncIntervalMs: 5000
  },
  tables: {
    users: {
      columns: {
        id: { type: 'string', constraints: ['primary key'] },
        name: { type: 'string' },
        email: { type: 'string' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' }
      },
      indexes: {
        email_idx: { columns: ['email'], unique: true }
      }
    },
    matches: {
      columns: {
        id: { type: 'string', constraints: ['primary key'] },
        users: { type: 'array' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' }
      }
    },
    messages: {
      columns: {
        id: { type: 'string', constraints: ['primary key'] },
        matchId: { type: 'string' },
        senderId: { type: 'string' },
        content: { type: 'string' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' }
      },
      indexes: {
        match_idx: { columns: ['matchId'] }
      }
    }
  }
};

// 环境特定配置
const environments: Record<string, DatabaseConfigType> = {
  development: {
    ...baseConfig as DatabaseConfigType,
    engine: 'mock',
    name: 'app_database_dev',
    version: 1,
    sync: {
      enabled: true,
      strategy: 'periodic',
      conflictResolution: 'server-wins',
      syncIntervalMs: 5000
    }
  },
  production: {
    ...baseConfig as DatabaseConfigType,
    engine: 'postgres',
    name: 'app_database_prod',
    version: 1,
    sync: {
      enabled: true,
      strategy: 'periodic',
      conflictResolution: 'server-wins',
      syncIntervalMs: 5000
    }
  }
};

// 获取当前环境
const getEnvironment = (): string => {
  return process.env.NODE_ENV || 'development';
};

// 导出默认配置
export const defaultConfig: DatabaseConfigType = environments[getEnvironment()];

// 创建配置
export function createConfig(options: Partial<DatabaseConfigType> = {}): DatabaseConfigType {
  return {
    ...defaultConfig,
    ...options
  };
}

// 导出配置构建器供自定义配置使用
export const configBuilder = new DatabaseConfigBuilder();