import { ServiceConfig } from '../types';
import { DatabaseConfig } from '@/core/lib/db/types/database.types';

export class ConfigManager {
  private static config: ServiceConfig = {
    type: 'development',
    options: {},
    environment: 'development',
    features: {
      offline: false,
      sync: false,
      encryption: false
    }
  };

  static setConfig(config: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static getConfig(): ServiceConfig {
    return this.config;
  }

  static setDatabaseConfig(config: DatabaseConfig): void {
    this.config.database = config;
  }

  static getDatabaseConfig(): DatabaseConfig | undefined {
    return this.config.database;
  }
} 