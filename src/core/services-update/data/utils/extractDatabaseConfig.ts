// src/core/services-update/data/utils/extractDatabaseConfig.ts

import { DataServiceConfig } from '../types';
import type { DatabaseConfig } from '@/core/lib/db/types/database.types';

// 为每种 adapter 明确类型，提升类型安全
// 可根据实际项目类型定义进一步完善

type IndexedDBOpts = {
  name?: string;
  version?: number;
  tables?: Record<string, any>;
  engine?: string;
  autoSave?: boolean;
  encryptionKey?: string;
};

type SqliteOpts = {
  name?: string;
  location?: string;
  encryption?: boolean;
};

type DrizzleOpts = {
  url?: string;
  schema?: string;
};

/**
 * 通用配置提取函数
 * 根据 DataServiceConfig 适配不同数据库 client 的 config
 */
export function extractDatabaseConfig(config: DataServiceConfig): DatabaseConfig | any {
  const { adapter, options } = config.services.data;

  switch (adapter) {
    case 'indexeddb': {
      const idbOpts = (options?.indexeddb ?? {}) as IndexedDBOpts;
      return {
        name: idbOpts.name,
        version: idbOpts.version ?? 1,
        tables: idbOpts.tables ?? {},
        engine: idbOpts.engine ?? 'indexeddb',
        autoSave: idbOpts.autoSave ?? false,
        encryptionKey: idbOpts.encryptionKey,
      };
    }
    case 'sqlite': {
      const sqliteOpts = (options?.sqlite ?? {}) as SqliteOpts;
      return {
        name: sqliteOpts.name,
        version: 1, // 可根据需要适配
        engine: 'sqlite',
        location: sqliteOpts.location,
        encryption: sqliteOpts.encryption,
        tables: {}, // 你可根据业务实际传递
      };
    }
    case 'drizzle': {
      const drizzleOpts = (options?.drizzle ?? {}) as DrizzleOpts;
      return {
        url: drizzleOpts.url,
        schema: drizzleOpts.schema,
        engine: 'drizzle',
      };
    }
    default:
      throw new Error(`Unsupported adapter: ${adapter}`);
  }
}