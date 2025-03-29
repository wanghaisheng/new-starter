import { DatabaseConfig } from './types/database.types';

export const config: DatabaseConfig = {
  name: 'app_database',
  version: 1,
  engine: 'sqlite',
  offline: {
    maxStorageSize: 50 * 1024 * 1024, // 50MB
    maxEntitiesPerTable: 10000,
    compressionEnabled: true,
    encryptionEnabled: true
  }
}; 