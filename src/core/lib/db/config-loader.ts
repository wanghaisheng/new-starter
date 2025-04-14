import { DatabaseConfig, defaultConfig } from './config';
import { logger } from '@/core/lib/logger';
import fs from 'fs';
import path from 'path';

export class ConfigLoader {
  static async loadConfig(): Promise<DatabaseConfig> {
    const config = { ...defaultConfig };

    try {
      // 从环境变量加载配置
      this.loadFromEnv(config);

      // 从配置文件加载配置
      await this.loadFromFile(config);

      // 验证配置
      this.validateConfig(config);

      logger.info('Database configuration loaded', {
        environment: config.env.environment,
        onlineStorage: config.storage.online.type,
        offlineEnabled: config.env.enableOffline
      });

      return config;
    } catch (error) {
      logger.error('Failed to load database configuration', { error });
      throw error;
    }
  }

  private static loadFromEnv(config: DatabaseConfig): void {
    // 环境配置
    if (process.env.NODE_ENV) {
      config.env.environment = process.env.NODE_ENV as 'development' | 'production';
    }
    if (process.env.ENABLE_OFFLINE) {
      config.env.enableOffline = process.env.ENABLE_OFFLINE === 'true';
    }
    if (process.env.ENABLE_HYBRID) {
      config.env.enableHybrid = process.env.ENABLE_HYBRID === 'true';
    }

    // 在线存储配置
    if (process.env.ONLINE_STORAGE_TYPE) {
      config.storage.online.type = process.env.ONLINE_STORAGE_TYPE as 'mock' | 'sqlite' | 'postgres';
    }
    if (process.env.DB_HOST) config.storage.online.connection.host = process.env.DB_HOST;
    if (process.env.DB_PORT) config.storage.online.connection.port = parseInt(process.env.DB_PORT);
    if (process.env.DB_NAME) config.storage.online.connection.database = process.env.DB_NAME;
    if (process.env.DB_USER) config.storage.online.connection.username = process.env.DB_USER;
    if (process.env.DB_PASSWORD) config.storage.online.connection.password = process.env.DB_PASSWORD;

    // 离线存储配置
    if (process.env.OFFLINE_STORAGE_TYPE) {
      config.storage.offline.type = process.env.OFFLINE_STORAGE_TYPE as 'memory' | 'indexeddb' | 'sqlite';
    }
    if (process.env.OFFLINE_DB_NAME) config.storage.offline.options.name = process.env.OFFLINE_DB_NAME;
    if (process.env.OFFLINE_DB_VERSION) {
      config.storage.offline.options.version = parseInt(process.env.OFFLINE_DB_VERSION);
    }
    if (process.env.OFFLINE_AUTO_SAVE) {
      config.storage.offline.options.autoSave = process.env.OFFLINE_AUTO_SAVE === 'true';
    }

    // 同步配置
    if (process.env.AUTO_SYNC) {
      config.sync.autoSync = process.env.AUTO_SYNC === 'true';
    }
    if (process.env.SYNC_INTERVAL) {
      config.sync.syncInterval = parseInt(process.env.SYNC_INTERVAL);
    }
    if (process.env.CONFLICT_RESOLUTION) {
      config.sync.conflictResolution = process.env.CONFLICT_RESOLUTION as 'server' | 'client' | 'manual';
    }

    // 测试数据配置
    if (process.env.LOAD_TEST_DATA) {
      config.testData.loadOnStartup = process.env.LOAD_TEST_DATA === 'true';
    }
    if (process.env.TEST_DATA_SOURCE) {
      config.testData.source = process.env.TEST_DATA_SOURCE as 'example' | 'dating' | 'custom';
    }
    if (process.env.TEST_DATA_PATH) {
      config.testData.customPath = process.env.TEST_DATA_PATH;
    }
  }

  private static async loadFromFile(config: DatabaseConfig): Promise<void> {
    const configPath = path.join(process.cwd(), 'config', 'database.json');
    
    if (fs.existsSync(configPath)) {
      try {
        const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        Object.assign(config, fileConfig);
      } catch (error) {
        logger.warn('Failed to load database config file', { error });
      }
    }
  }

  private static validateConfig(config: DatabaseConfig): void {
    // 验证环境配置
    if (!['development', 'production'].includes(config.env.environment)) {
      throw new Error('Invalid environment configuration');
    }

    // 验证在线存储配置
    if (!['mock', 'sqlite', 'postgres'].includes(config.storage.online.type)) {
      throw new Error('Invalid online storage type');
    }

    // 验证离线存储配置
    if (config.env.enableOffline) {
      if (!['memory', 'indexeddb', 'sqlite'].includes(config.storage.offline.type)) {
        throw new Error('Invalid offline storage type');
      }
    }

    // 验证同步配置
    if (config.sync.autoSync && config.sync.syncInterval < 1000) {
      throw new Error('Sync interval must be at least 1000ms');
    }

    // 验证测试数据配置
    if (config.testData.loadOnStartup) {
      if (!['example', 'dating', 'custom'].includes(config.testData.source)) {
        throw new Error('Invalid test data source');
      }
      if (config.testData.source === 'custom' && !config.testData.customPath) {
        throw new Error('Custom test data path is required when using custom source');
      }
    }
  }
} 