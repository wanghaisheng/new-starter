import { IDatabaseClient, DatabaseConfig } from './interfaces';
import { MockDatabaseClient } from './clients/mock/mock-client';
import { IndexedDBClient } from './clients/indexeddb/indexeddb-client';
import { SQLiteClient } from './clients/sqlite/sqlite-client';
import { CapacitorSQLiteClient } from './clients/capacitor-sqlite/capacitor-sqlite-client';
import { MockIndexedDBClient } from './clients/indexeddb/fake-indexeddb';
import { FirebaseClient } from './clients/firebase/firebase-client';
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
   * @param config 数据库配置
   * @returns 数据库客户端实例
   */
  static createClient(type: string, config: DatabaseConfig = { name: 'default', version: 1, engine: 'mock' }): IDatabaseClient {
    try {
      const clientClass = this.clientRegistry.get(type.toLowerCase());
      
      if (!clientClass) {
        console.warn(`未知的数据库客户端类型: ${type}，使用MockDatabaseClient替代`);
        return new MockDatabaseClient(config);
      }
      
      // 对于浏览器环境的特殊处理
      if (this.isBrowserEnvironment) {
        // 在浏览器环境中，如果使用MOCK_INDEXEDDB但遇到问题，回退到标准IndexedDB
        if (type.toLowerCase() === DatabaseClientType.MOCK_INDEXEDDB.toLowerCase()) {
          try {
            return new MockIndexedDBClient(config);
          } catch (error) {
            console.warn('创建MockIndexedDBClient失败，回退到IndexedDBClient:', error);
            return new IndexedDBClient(config);
          }
        }
      }
      
      return new clientClass(config);
    } catch (error) {
      console.error(`创建数据库客户端失败: ${error}`);
      // 回退到最基本的MockDatabaseClient，这应该在任何环境都能工作
      return new MockDatabaseClient(config);
    }
  }
  
  /**
   * 根据环境变量创建数据库客户端
   * @returns 数据库客户端实例
   */
  static createClientFromEnv(): IDatabaseClient {
    try {
      // 获取环境变量
      const dbEnv = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
      const dbType = process.env.NEXT_PUBLIC_MOCK_DB_TYPE || 'mock';
      const dbName = process.env.NEXT_PUBLIC_DB_NAME || 'app-database';
      const dbVersion = parseInt(process.env.NEXT_PUBLIC_DB_VERSION || '1', 10);
      const useFakeIndexedDB = process.env.NEXT_PUBLIC_USE_FAKE_INDEXEDDB === 'true';
      
      // 创建配置
      const config: DatabaseConfig = {
        name: dbName,
        version: dbVersion,
        engine: dbType as any
      };
      
      // 根据环境选择客户端类型
      let clientType = dbType;
      
      // 开发环境逻辑
      if (dbEnv === 'mock') {
        // 如果明确指定了使用fake-indexeddb或默认情况
        if (useFakeIndexedDB || dbType === 'mock-indexeddb') {
          clientType = this.isBrowserEnvironment ? 
            DatabaseClientType.MOCK_INDEXEDDB : 
            DatabaseClientType.MOCK;
        }
      }
      // 本地环境逻辑
      else if (dbEnv === 'local') {
        if (this.isBrowserEnvironment) {
          clientType = DatabaseClientType.INDEXEDDB;
        } else if (Capacitor.isNativePlatform()) {
          clientType = DatabaseClientType.CAPACITOR_SQLITE;
        } else {
          clientType = DatabaseClientType.SQLITE;
        }
      }
      // 生产环境逻辑
      else if (dbEnv === 'production') {
        if (Capacitor.isNativePlatform()) {
          clientType = DatabaseClientType.CAPACITOR_SQLITE;
        } else if (process.env.NEXT_PUBLIC_USE_FIREBASE === 'true') {
          clientType = DatabaseClientType.FIREBASE;
        } else if (this.isBrowserEnvironment) {
          clientType = DatabaseClientType.INDEXEDDB;
        } else {
          clientType = DatabaseClientType.SQLITE;
        }
      }
      
      console.log(`根据环境创建数据库客户端: ${clientType}`);
      
      // 创建客户端
      return this.createClient(clientType, config);
    } catch (error) {
      console.error('从环境创建数据库客户端失败:', error);
      // 回退到最安全的选项
      return new MockDatabaseClient({
        name: 'fallback-database',
        version: 1,
        engine: 'mock'
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
// 混合模式可以在将来实现