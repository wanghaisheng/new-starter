// src/core/services/data/utils/extractDatabaseConfig.ts

import { DataServiceConfig } from '../types';
import type { DatabaseConfig } from '@/core/lib/db/types/database';

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
  tables?: Record<string, any>;
};

type DrizzleOpts = {
  url?: string;
  schema?: string;
  tables?: Record<string, any>;
};

/**
 * 通用配置提取函数
 * 根据 DataServiceConfig 适配不同数据库 client 的 config
 */
export function extractDatabaseConfig(config: DataServiceConfig): DatabaseConfig | any {
  const { onlineProvider, offlineProvider, options } = config.services.data;

  // 优先判断 offlineProvider，其次判断 onlineProvider
  const provider = offlineProvider || onlineProvider;

  switch (provider) {
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
        tables: sqliteOpts.tables ?? {},
      };
    }
    case 'drizzle': {
      const drizzleOpts = (options?.drizzle ?? {}) as DrizzleOpts;
      return {
        url: drizzleOpts.url,
        schema: drizzleOpts.schema,
        engine: 'drizzle',
        // 自动为含特殊字符的表名加双引号，兼容 SQLite
        tables: drizzleOpts.tables
          ? Object.fromEntries(Object.entries(drizzleOpts.tables).map(([k, v]) => [
              /[-\s]/.test(k) ? `"${k}"` : k,
              v
            ]))
          : undefined,
      };
    }
    // 其它 provider 可继续扩展
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}