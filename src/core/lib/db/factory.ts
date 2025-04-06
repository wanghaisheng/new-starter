import type { IDatabaseClient, IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import type { config as DatabaseConfig } from '@/core/lib/db/config';
import { MockDatabaseClient } from '@/core/lib/db/clients/mock/mock-client';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb';
import { SQLiteClient } from '@/core/lib/db/clients/sqlite/sqlite-client';
import { CloudflareD1Client } from '@/core/lib/db/clients/cloudflare';
import { FirebaseClient } from '@/core/lib/db/clients/firebase';
import { SupabaseClient } from '@/core/lib/db/clients/supabase/supabase-client';
import { TursoClient } from '@/core/lib/db/clients/turso/turso-client';
import { TiDBClient } from '@/core/lib/db/clients/tidb/tidb-client';
import { PostgresClient } from '@/core/lib/db/clients/postgres/postgres-client';
import { HybridDatabaseClient } from '@/core/lib/db/clients/hybrid';
import { DatabaseError, DatabaseErrorCode } from '@/core/lib/db/errors/database-error';
import { Capacitor } from '@capacitor/core';
import { Logger } from '@/core/lib/utils/logger';
import { KyselyClient } from '@/core/lib/db/clients/kysely-client';

/**
 * 数据库客户端类型
 */
export enum DatabaseClientType {
  MOCK = 'mock',
  INDEXEDDB = 'indexeddb',
  SQLITE = 'sqlite',
  CLOUDFLARE_D1 = 'cloudflare-d1',
  FIREBASE = 'firebase',
  SUPABASE = 'supabase',
  TURSO = 'turso',
  TIDB = 'tidb',
  POSTGRES = 'postgres',
  HYBRID = 'hybrid',
  KYSELY = 'kysely'
}

/**
 * 数据库工厂类
 * 负责创建和管理数据库客户端实例
 */
export class DatabaseFactory {
  private static instance: DatabaseFactory;
  private registeredClients: Map<DatabaseClientType, new (config: any) => IDatabaseClient>;
  private logger: Logger;

  private constructor() {
    this.registeredClients = new Map();
    this.logger = new Logger('DatabaseFactory');
    this.registerDefaultClients();
  }

  public static getInstance(): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory();
    }
    return DatabaseFactory.instance;
  }

  private registerDefaultClients(): void {
    this.registeredClients.set(DatabaseClientType.MOCK, MockDatabaseClient as any);
    this.registeredClients.set(DatabaseClientType.INDEXEDDB, IndexedDBClient as any);
    this.registeredClients.set(DatabaseClientType.SQLITE, SQLiteClient as any);
    this.registeredClients.set(DatabaseClientType.CLOUDFLARE_D1, CloudflareD1Client as any);
    this.registeredClients.set(DatabaseClientType.FIREBASE, FirebaseClient as any);
    this.registeredClients.set(DatabaseClientType.SUPABASE, SupabaseClient as any);
    this.registeredClients.set(DatabaseClientType.TURSO, TursoClient as any);
    this.registeredClients.set(DatabaseClientType.TIDB, TiDBClient as any);
    this.registeredClients.set(DatabaseClientType.POSTGRES, PostgresClient as any);
    this.registeredClients.set(DatabaseClientType.HYBRID, HybridDatabaseClient as any);
    this.registeredClients.set(DatabaseClientType.KYSELY, KyselyClient as any);
  }

  public registerClientType(type: DatabaseClientType, clientClass: new (config: any) => IDatabaseClient): void {
    this.registeredClients.set(type, clientClass);
    this.logger.info(`Registered new database client type: ${type}`);
  }

  public async createClient(config: typeof DatabaseConfig): Promise<IDatabaseClient> {
    try {
      const ClientClass = this.registeredClients.get(config.engine as DatabaseClientType);
      if (!ClientClass) {
        throw new DatabaseError(
          `Unregistered database client type: ${config.engine}`,
          DatabaseErrorCode.INVALID_CLIENT_TYPE
        );
      }

      this.logger.info(`Creating database client of type: ${config.engine}`);
      const client = new ClientClass(config);
      await client.initialize();
      return client;
    } catch (error) {
      this.logger.error('Failed to create database client:', error);
      // Fallback to mock client
      return this.createMockClient();
    }
  }

  public async createClientFromEnv(): Promise<IDatabaseClient> {
    const env = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
    const config: typeof DatabaseConfig = {
      name: 'app-database',
      version: 1,
      engine: 'mock',
      tables: {}
    };

    switch (env) {
      case 'local':
        // 在浏览器环境中使用 IndexedDB
        if (typeof window !== 'undefined') {
          config.engine = 'indexeddb';
        } 
        // 在移动端使用 SQLite
        else if (Capacitor.isNativePlatform()) {
          config.engine = 'sqlite';
        } 
        // 在服务器端使用 Supabase
        else {
          config.engine = 'supabase';
        }
        break;
      case 'production':
        config.engine = 'supabase';
        break;
      case 'mock':
      default:
        config.engine = 'mock';
        break;
    }

    return this.createClient(config);
  }

  public async createHybridClient(config: {
    localConfig: typeof DatabaseConfig;
    remoteConfig: typeof DatabaseConfig;
    syncConfig?: Record<string, any>;
  }): Promise<IDatabaseClient> {
    try {
      const localClient = await this.createClient(config.localConfig);
      const remoteClient = await this.createClient(config.remoteConfig);
      
      return new HybridDatabaseClient({
        engine: 'hybrid',
        sync: {
          enabled: true,
          strategy: 'periodic',
          localClient,
          remoteClient,
          ...config.syncConfig
        }
      });
    } catch (error) {
      this.logger.error('Failed to create hybrid client:', error);
      throw new DatabaseError(
        'Failed to create hybrid client',
        DatabaseErrorCode.INITIALIZATION_ERROR,
        error
      );
    }
  }

  private async createMockClient(): Promise<IDatabaseClient> {
    this.logger.warn('Falling back to mock database client');
    const mockConfig: typeof DatabaseConfig = {
      name: 'mock-database',
      version: 1,
      engine: 'mock',
      tables: {},
      sync: {
        enabled: true,
        strategy: 'manual',
        offlineOnly: true
      }
    };
    return this.createClient(mockConfig);
  }
}