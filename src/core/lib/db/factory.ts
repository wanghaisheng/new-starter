import { Capacitor } from '@capacitor/core';
import { DatabaseConfig, DatabaseEngine, IDatabaseClient } from './interfaces';
import { MockDatabaseClient } from './mock/mock-database-client';
import { IndexedDBClient } from './indexeddb/indexeddb-client';
import { SQLiteClient } from './sqlite/sqlite-client';
import { SupabaseClient } from './supabase/supabase-client';

export class DatabaseFactory {
  static createClient(config: DatabaseConfig): IDatabaseClient {
    // 在移动端，如果配置为indexeddb，自动切换到sqlite
    if (Capacitor.isNativePlatform() && config.engine === 'indexeddb') {
      config.engine = 'sqlite';
    }

    switch (config.engine) {
      case 'mock':
        return new MockDatabaseClient();
      case 'indexeddb':
        return new IndexedDBClient({
          name: config.name || 'app_db',
          version: config.version || 1
        });
      case 'sqlite':
        return new SQLiteClient({
          name: config.name || 'app_db',
          encryptionKey: config.encryptionKey
        });
      case 'supabase':
        if (!config.url || !config.key) {
          throw new Error('Supabase configuration requires url and key');
        }
        return new SupabaseClient({
          url: config.url,
          key: config.key
        });
      default:
        throw new Error(`Unsupported database engine: ${config.engine}`);
    }
  }
} 