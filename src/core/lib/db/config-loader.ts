import type { DatabaseConfig, StorageType } from '@/core/lib/db/types/database.types';
import { logger } from '@/core/services/infrastructure/logger/logger-service';
import fs from 'fs';
import path from 'path';
import { SUPPORTED_STORAGE_TYPES, SUPPORTED_OFFLINE_STORAGE_TYPES, defaultConfig } from '@/core/lib/db/types/database.types';
import { configService } from '@/core/services/infrastructure/config';

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
    const nodeEnv = configService.get('NODE_ENV');
    if (nodeEnv) {
      config.env.environment = nodeEnv as 'development' | 'production';
    }
    const enableOffline = configService.get('ENABLE_OFFLINE');
    if (enableOffline !== undefined) {
      config.env.enableOffline = enableOffline === 'true';
    }
    const enableHybrid = configService.get('ENABLE_HYBRID');
    if (enableHybrid !== undefined) {
      config.env.enableHybrid = enableHybrid === 'true';
    }

    // 在线存储配置
    const onlineType = configService.get('ONLINE_STORAGE_TYPE');
    if (onlineType) {
      config.storage.online.type = onlineType as StorageType;
    }
    const dbHost = configService.get('DB_HOST');
    if (dbHost) config.storage.online.connection.host = dbHost;
    const dbPort = configService.get('DB_PORT');
    if (dbPort) config.storage.online.connection.port = Number(dbPort);
    const dbName = configService.get('DB_NAME');
    if (dbName) config.storage.online.connection.database = dbName;
    const dbUser = configService.get('DB_USER');
    if (dbUser) config.storage.online.connection.username = dbUser;
    const dbPassword = configService.get('DB_PASSWORD');
    if (dbPassword) config.storage.online.connection.password = dbPassword;

    // 离线存储配置
    const offlineType = configService.get('OFFLINE_STORAGE_TYPE');
    if (offlineType) {
      const offlineTypeValue = offlineType as StorageType;
      if (offlineTypeValue !== 'postgres') {
        config.storage.offline.type = offlineTypeValue;
      }
    }

    // 同步配置
    const autoSync = configService.get('AUTO_SYNC');
    if (autoSync !== undefined) {
      config.sync.enabled = autoSync === 'true';
    }
    const syncInterval = configService.get('SYNC_INTERVAL');
    if (syncInterval) {
      config.sync.syncIntervalMs = Number(syncInterval);
    }
    const conflictResolution = configService.get('CONFLICT_RESOLUTION');
    if (conflictResolution) {
      // 只允许 'client-wins' | 'server-wins' | 'last-write-wins'
      const allowed = ['client-wins', 'server-wins', 'last-write-wins'];
      if (allowed.includes(conflictResolution)) {
        config.sync.conflictResolution = conflictResolution as typeof config.sync.conflictResolution;
      }
    }

    // 测试数据配置
    const loadTestData = configService.get('LOAD_TEST_DATA');
    if (loadTestData !== undefined) {
      config.testData.loadOnStartup = loadTestData === 'true';
    }
    const testDataSource = configService.get('TEST_DATA_SOURCE');
    if (testDataSource) {
      config.testData.source = testDataSource as 'example' | 'dating';
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