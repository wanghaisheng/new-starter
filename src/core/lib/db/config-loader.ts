import type { DatabaseConfig, StorageType } from '@/core/lib/db/types/database.types';
import { logger } from '@/core/lib/logger';
import fs from 'fs';
import path from 'path';
import { SUPPORTED_STORAGE_TYPES, SUPPORTED_OFFLINE_STORAGE_TYPES, defaultConfig } from '@/core/lib/db/types/database.types';

export class ConfigLoader {
  static async loadConfig(): Promise<DatabaseConfig> {
    // 使用统一 defaultConfig 作为配置基础
    const config: DatabaseConfig = { ...defaultConfig };

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
      config.storage.online.type = process.env.ONLINE_STORAGE_TYPE as StorageType;
    }
    if (process.env.DB_HOST) config.storage.online.connection.host = process.env.DB_HOST;
    if (process.env.DB_PORT) config.storage.online.connection.port = parseInt(process.env.DB_PORT);
    if (process.env.DB_NAME) config.storage.online.connection.database = process.env.DB_NAME;
    if (process.env.DB_USER) config.storage.online.connection.username = process.env.DB_USER;
    if (process.env.DB_PASSWORD) config.storage.online.connection.password = process.env.DB_PASSWORD;

    // 离线存储配置
    if (process.env.OFFLINE_STORAGE_TYPE) {
      const offlineType = process.env.OFFLINE_STORAGE_TYPE as StorageType;
      if (offlineType !== 'postgres') {
        config.storage.offline.type = offlineType;
      }
    }

    // 同步配置
    if (process.env.AUTO_SYNC) {
      config.sync.enabled = process.env.AUTO_SYNC === 'true';
    }
    if (process.env.SYNC_INTERVAL) {
      config.sync.syncIntervalMs = parseInt(process.env.SYNC_INTERVAL);
    }
    if (process.env.CONFLICT_RESOLUTION) {
      // 只允许 'client-wins' | 'server-wins' | 'last-write-wins'
      const allowed = ['client-wins', 'server-wins', 'last-write-wins'];
      if (allowed.includes(process.env.CONFLICT_RESOLUTION)) {
        config.sync.conflictResolution = process.env.CONFLICT_RESOLUTION as typeof config.sync.conflictResolution;
      }
    }

    // 测试数据配置
    if (process.env.LOAD_TEST_DATA) {
      config.testData.loadOnStartup = process.env.LOAD_TEST_DATA === 'true';
    }
    if (process.env.TEST_DATA_SOURCE) {
      config.testData.source = process.env.TEST_DATA_SOURCE as 'example' | 'dating';
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
    if (!SUPPORTED_STORAGE_TYPES.includes(config.storage.online.type)) {
      throw new Error('Invalid online storage type');
    }

    // 验证离线存储配置
    const supportedOfflineTypes = SUPPORTED_OFFLINE_STORAGE_TYPES;
    if (config.env.enableOffline && !supportedOfflineTypes.includes(config.storage.offline.type)) {
      throw new Error('Invalid offline storage type');
    }

    // 验证同步配置
    if (config.sync.enabled && config.sync.syncIntervalMs !== undefined && config.sync.syncIntervalMs < 1000) {
      throw new Error('Sync interval must be at least 1000ms');
    }

    // 验证测试数据配置
    if (config.testData.loadOnStartup) {
      if (!['example', 'dating'].includes(config.testData.source)) {
        throw new Error('Invalid test data source');
      }
    }
  }
} 