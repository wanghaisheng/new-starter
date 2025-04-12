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
 * 环境类型
 */
export enum EnvironmentType {
  MOCK = 'mock',
  DEV = 'dev',
  PROD = 'prod'
}

/**
 * 数据库工厂类
 * 负责创建和管理数据库客户端实例
 */
export class DatabaseFactory {
  private static instance: DatabaseFactory;
  private registeredClients: Map<DatabaseClientType, new (config: any) => IDatabaseClient>;
  private logger: Logger;
  private currentEnvironment: EnvironmentType;

  private constructor() {
    this.registeredClients = new Map();
    this.logger = new Logger('DatabaseFactory');
    this.currentEnvironment = this.getEnvironment();
    this.registerEnvironmentSpecificClients();
  }

  public static getInstance(): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory();
    }
    return DatabaseFactory.instance;
  }

  private getEnvironment(): EnvironmentType {
    const env = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
    return EnvironmentType[env.toUpperCase() as keyof typeof EnvironmentType] || EnvironmentType.MOCK;
  }

  private validateClientType(type: DatabaseClientType): void {
    const allowedClients = this.getAllowedClientsForEnvironment();
    if (!allowedClients.includes(type)) {
      throw new DatabaseError(
        `Client type ${type} is not allowed in ${this.currentEnvironment} environment`,
        DatabaseErrorCode.INVALID_CLIENT_TYPE
      );
    }
  }

  private getAllowedClientsForEnvironment(): DatabaseClientType[] {
    switch (this.currentEnvironment) {
      case EnvironmentType.MOCK:
        return [DatabaseClientType.MOCK];
      case EnvironmentType.DEV:
        return [
          DatabaseClientType.MOCK,
          DatabaseClientType.INDEXEDDB,
          DatabaseClientType.SQLITE,
          DatabaseClientType.SUPABASE,
          DatabaseClientType.TURSO
        ];
      case EnvironmentType.PROD:
        return [
          DatabaseClientType.SUPABASE,
          DatabaseClientType.POSTGRES,
          DatabaseClientType.TURSO,
          DatabaseClientType.TIDB,
          DatabaseClientType.KYSELY
        ];
      default:
        return [DatabaseClientType.MOCK];
    }
  }

  private registerEnvironmentSpecificClients(): void {
    this.logger.info(`Initializing database factory for environment: ${this.currentEnvironment}`);

    // Always register mock client for fallback
    this.registeredClients.set(DatabaseClientType.MOCK, MockDatabaseClient as any);
    this.logger.debug('Registered fallback mock client');

    const allowedClients = this.getAllowedClientsForEnvironment();
    this.logger.debug(`Allowed clients for ${this.currentEnvironment}: ${allowedClients.join(', ')}`);

    // Register clients based on environment
    if (allowedClients.includes(DatabaseClientType.INDEXEDDB)) {
      this.registeredClients.set(DatabaseClientType.INDEXEDDB, IndexedDBClient as any);
    }
    if (allowedClients.includes(DatabaseClientType.SQLITE)) {
      this.registeredClients.set(DatabaseClientType.SQLITE, SQLiteClient as any);
    }
    if (allowedClients.includes(DatabaseClientType.SUPABASE)) {
      this.registeredClients.set(DatabaseClientType.SUPABASE, SupabaseClient as any);
    }
    if (allowedClients.includes(DatabaseClientType.CLOUDFLARE_D1)) {
      this.registeredClients.set(DatabaseClientType.CLOUDFLARE_D1, CloudflareD1Client as any);
    }
    if (allowedClients.includes(DatabaseClientType.FIREBASE)) {
      this.registeredClients.set(DatabaseClientType.FIREBASE, FirebaseClient as any);
    }
    if (allowedClients.includes(DatabaseClientType.TURSO)) {
      this.registeredClients.set(DatabaseClientType.TURSO, TursoClient as any);
    }
    if (allowedClients.includes(DatabaseClientType.TIDB)) {
      this.registeredClients.set(DatabaseClientType.TIDB, TiDBClient as any);
    }
    if (allowedClients.includes(DatabaseClientType.POSTGRES)) {
      this.registeredClients.set(DatabaseClientType.POSTGRES, PostgresClient as any);
    }
    if (allowedClients.includes(DatabaseClientType.HYBRID)) {
      this.registeredClients.set(DatabaseClientType.HYBRID, HybridDatabaseClient as any);
    }
    if (allowedClients.includes(DatabaseClientType.KYSELY)) {
      this.registeredClients.set(DatabaseClientType.KYSELY, KyselyClient as any);
    }

    this.logger.info(`Successfully registered ${this.registeredClients.size} database clients for ${this.currentEnvironment}`);
  }

  public registerClientType(type: DatabaseClientType, clientClass: new (config: any) => IDatabaseClient): void {
    this.validateClientType(type);
    this.registeredClients.set(type, clientClass);
    this.logger.info(`Registered new database client type: ${type}`);
  }

  public async createClient(config: typeof DatabaseConfig): Promise<IDatabaseClient> {
    try {
      const clientType = config.engine as DatabaseClientType;
      this.validateClientType(clientType);

      // Force mock client in mock environment
      if (this.currentEnvironment === EnvironmentType.MOCK) {
        this.logger.info('Mock environment detected, using mock client');
        return this.createMockClient();
      }

      const ClientClass = this.registeredClients.get(clientType);
      if (!ClientClass) {
        throw new DatabaseError(
          `Unregistered database client type: ${clientType}`,
          DatabaseErrorCode.INVALID_CLIENT_TYPE
        );
      }

      this.logger.info(`Creating database client of type: ${clientType}`);
      this.logger.debug(`Client configuration: ${JSON.stringify(config)}`);

      const client = new ClientClass(config);
      await client.initialize();
      
      this.logger.info(`Successfully created and initialized ${clientType} client`);
      return client;
    } catch (error) {
      this.logger.error('Failed to create database client:', error);
      this.logger.warn('Falling back to mock client');
      return this.createMockClient();
    }
  }

  public async createClientFromEnv(): Promise<IDatabaseClient> {
    const config: typeof DatabaseConfig = {
      name: 'app-database',
      version: 1,
      engine: 'mock',
      tables: {}
    };

    // Always use mock client in mock environment
    if (this.currentEnvironment === EnvironmentType.MOCK) {
      this.logger.info('Mock environment detected, using mock client');
      return this.createMockClient();
    }

    switch (this.currentEnvironment) {
      case EnvironmentType.DEV:
        if (typeof window !== 'undefined') {
          config.engine = 'indexeddb';
        } else if (Capacitor.isNativePlatform()) {
          config.engine = 'sqlite';
        } else {
          config.engine = 'supabase';
        }
        break;
      case EnvironmentType.PROD:
        config.engine = 'supabase';
        break;
      default:
        config.engine = 'mock';
        break;
    }

    this.logger.info(`Creating client from environment: ${this.currentEnvironment}`);
    return this.createClient(config);
  }

  public async createHybridClient(config: {
    localConfig: typeof DatabaseConfig;
    remoteConfig: typeof DatabaseConfig;
    syncConfig?: Record<string, any>;
  }): Promise<IDatabaseClient> {
    try {
      this.logger.info('Creating hybrid database client');
      this.logger.debug('Local config:', config.localConfig);
      this.logger.debug('Remote config:', config.remoteConfig);

      // Force mock client in mock environment
      if (this.currentEnvironment === EnvironmentType.MOCK) {
        this.logger.info('Mock environment detected, using mock client');
        return this.createMockClient();
      }

      const localClient = await this.createClient(config.localConfig);
      const remoteClient = await this.createClient(config.remoteConfig);
      
      const hybridClient = new HybridDatabaseClient({
        engine: 'hybrid',
        sync: {
          enabled: true,
          strategy: 'periodic',
          localClient,
          remoteClient,
          ...config.syncConfig
        }
      });

      this.logger.info('Successfully created hybrid client');
      return hybridClient;
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