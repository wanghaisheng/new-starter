import { IDatabaseClient, DatabaseConfig, DatabaseEngine } from '@/core/lib/db/interfaces';
import { MockDatabaseClient } from '@/core/lib/db/clients/mock/mock-client';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { SQLiteClient } from '@/core/lib/db/clients/sqlite/sqlite-client';
import { CapacitorSQLiteClient } from '@/core/lib/db/clients/capacitor-sqlite/capacitor-sqlite-client';
import { MockIndexedDBClient } from '@/core/lib/db/clients/indexeddb/fake-indexeddb';
import { FirebaseClient } from '@/core/lib/db/clients/firebase/firebase-client';
import { HybridDatabaseClient } from '@/core/lib/db/clients/hybrid';
import { Capacitor } from '@capacitor/core';

/**
 * 数据库客户端类型
 */
export enum DatabaseClientType {
  MOCK = 'mock',
  MOCK_INDEXEDDB = 'mock-indexeddb',
  INDEXEDDB = 'indexeddb',
  SQLITE = 'sqlite',
  CAPACITOR_SQLITE = 'capacitor-sqlite',
  FIREBASE = 'firebase',
  HYBRID = 'hybrid' // 混合模式，同时使用多种存储
}

/**
 * 数据库工厂类
 * 负责创建和管理数据库客户端实例
 */
export class DatabaseFactory {
  private static clientRegistry: Map<string, any> = new Map();
  private static isBrowserEnvironment = typeof window !== 'undefined';
  
  /**
   * 注册数据库客户端类型
   * @param type 客户端类型
   * @param clientClass 客户端类
   */
  static registerClientType(type: string, clientClass: any): void {
    this.clientRegistry.set(type.toLowerCase(), clientClass);
  }
  
  /**
   * 创建数据库客户端
   * @param type 客户端类型
   * @param config 配置参数
   * @returns 数据库客户端实例
   */
  static createClient(type: string, config: Partial<DatabaseConfig> = {}): IDatabaseClient {
    try {
      // 确保配置包含必要的属性
      const defaultConfig: DatabaseConfig = {
        name: 'default',
        version: 1,
        engine: 'mock' as DatabaseEngine,
        tables: {} // 提供默认的空表定义
      };
      
      // 合并用户提供的配置
      const mergedConfig = { ...defaultConfig, ...config };
      
      const clientClass = this.clientRegistry.get(type.toLowerCase());
      if (!clientClass) {
        throw new Error(`未注册的数据库客户端类型: ${type}`);
      }
      
      return new clientClass(mergedConfig);
    } catch (error) {
      console.error(`创建数据库客户端失败: ${error}`);
      
      // 如果创建失败，尝试使用mock客户端作为降级方案
      console.warn('降级到mock数据库客户端');
      return new MockDatabaseClient({
        name: 'mock_fallback',
        version: 1,
        engine: 'mock' as DatabaseEngine,
        tables: {}
      });
    }
  }
  
  /**
   * 根据环境创建客户端
   * 从环境变量决定使用哪种客户端类型
   */
  static createClientFromEnv(): IDatabaseClient {
    try {
      const env = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
      const useHybrid = process.env.NEXT_PUBLIC_USE_HYBRID_CLIENT === 'true';
      
      let clientType: string;
      let clientConfig: DatabaseConfig = { 
        name: 'app_database', 
        version: 1,
        engine: 'mock' as DatabaseEngine,
        tables: {}
      };
      
      // 如果启用了混合客户端，则直接使用混合客户端
      if (useHybrid) {
        console.log('使用混合数据库客户端');
        clientType = DatabaseClientType.HYBRID;
        
        // 混合模式需要稍后设置本地和远程客户端
        clientConfig = { 
          ...clientConfig, 
          name: 'hybrid_db',
          engine: 'hybrid' as DatabaseEngine,
          tables: {}
        };
        
        return this.createClient(clientType, clientConfig);
      }
      
      switch (env) {
        case 'local':
          // 本地环境使用 IndexedDB 或 SQLite
          if (this.isBrowserEnvironment) {
            clientType = DatabaseClientType.INDEXEDDB;
            clientConfig = { 
              ...clientConfig, 
              name: 'app_local_db', 
              engine: 'indexeddb' as DatabaseEngine,
              tables: {} 
            };
          } else {
            clientType = DatabaseClientType.SQLITE;
            clientConfig = { 
              ...clientConfig, 
              name: 'app_local.db',
              engine: 'sqlite' as DatabaseEngine,
              tables: {}
            };
          }
          break;
          
        case 'production':
          // 生产环境使用 Firebase 或 Capacitor SQLite
          if (this.isBrowserEnvironment) {
            clientType = DatabaseClientType.FIREBASE;
            clientConfig = { 
              ...clientConfig, 
              name: 'production_db',
              engine: 'firebase' as DatabaseEngine,
              tables: {}
            };
          } else {
            clientType = DatabaseClientType.CAPACITOR_SQLITE;
            clientConfig = { 
              ...clientConfig, 
              name: 'app_production.db',
              engine: 'capacitor-sqlite' as DatabaseEngine,
              tables: {}
            };
          }
          break;
          
        default:
          // 开发环境使用 Mock
          clientType = DatabaseClientType.MOCK;
          clientConfig = { 
            ...clientConfig, 
            name: 'app_mock_db',
            engine: 'mock' as DatabaseEngine,
            tables: {}
          };
      }
      
      console.log(`创建数据库客户端: ${clientType}, 环境: ${env}`);
      return this.createClient(clientType, clientConfig);
    } catch (error) {
      console.error('根据环境创建客户端失败:', error);
      return this.createClient(DatabaseClientType.MOCK, { 
        name: 'fallback_db', 
        version: 1, 
        engine: 'mock' as DatabaseEngine,
        tables: {}
      });
    }
  }
  
  /**
   * 创建混合数据库客户端
   * 
   * @param localClientType 本地客户端类型
   * @param remoteClientType 远程客户端类型
   * @param config 配置参数
   * @returns 混合数据库客户端实例
   */
  static createHybridClient(
    localClientType: string = DatabaseClientType.INDEXEDDB,
    remoteClientType: string = DatabaseClientType.FIREBASE,
    config: Partial<DatabaseConfig> = {}
  ): IDatabaseClient {
    try {
      // 默认配置
      const defaultConfig: DatabaseConfig = {
        name: 'hybrid_db',
        version: 1,
        engine: 'hybrid' as DatabaseEngine,
        tables: {}
      };
      
      // 合并配置
      const mergedConfig = { ...defaultConfig, ...config };
      
      // 创建本地客户端
      const localClient = this.createClient(localClientType, {
        ...mergedConfig,
        name: `${mergedConfig.name}_local`,
        engine: localClientType.toLowerCase() as DatabaseEngine
      });
      
      // 创建远程客户端
      const remoteClient = this.createClient(remoteClientType, {
        ...mergedConfig,
        name: `${mergedConfig.name}_remote`,
        engine: remoteClientType.toLowerCase() as DatabaseEngine
      });
      
      // 创建混合客户端配置
      const hybridConfig = {
        engine: 'hybrid' as DatabaseEngine,
        name: mergedConfig.name,
        version: mergedConfig.version,
        tables: mergedConfig.tables,
        sync: {
          enabled: true,
          strategy: 'periodic' as const,
          localClient,
          remoteClient,
          syncIntervalMs: 60000, // 默认1分钟同步一次
          conflictResolution: 'last-write-wins' as const
        }
      };
      
      // 创建混合客户端
      return new HybridDatabaseClient(hybridConfig);
    } catch (error) {
      console.error('创建混合客户端失败:', error);
      return this.createClient(DatabaseClientType.MOCK, { 
        name: 'fallback_hybrid_db', 
        version: 1, 
        engine: 'mock' as DatabaseEngine,
        tables: {}
      });
    }
  }
}

// 注册默认客户端类型
DatabaseFactory.registerClientType(DatabaseClientType.MOCK, MockDatabaseClient);
DatabaseFactory.registerClientType(DatabaseClientType.MOCK_INDEXEDDB, MockIndexedDBClient);
DatabaseFactory.registerClientType(DatabaseClientType.INDEXEDDB, IndexedDBClient);
DatabaseFactory.registerClientType(DatabaseClientType.SQLITE, SQLiteClient);
DatabaseFactory.registerClientType(DatabaseClientType.CAPACITOR_SQLITE, CapacitorSQLiteClient);
DatabaseFactory.registerClientType(DatabaseClientType.FIREBASE, FirebaseClient);
DatabaseFactory.registerClientType(DatabaseClientType.HYBRID, HybridDatabaseClient);