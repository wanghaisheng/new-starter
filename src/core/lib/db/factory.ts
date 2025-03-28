import { IDatabaseClient, DatabaseConfig } from './interfaces';
import { MockDatabaseClient } from './clients/mock/mock-client';
import { IndexedDBClient } from './clients/indexeddb/indexeddb-client';
import { SQLiteClient } from './clients/sqlite/sqlite-client';
import { CapacitorSQLiteClient } from './clients/capacitor-sqlite/capacitor-sqlite-client';

/**
 * 数据库客户端类型
 */
export enum DatabaseClientType {
  MOCK = 'mock',
  INDEXEDDB = 'indexeddb',
  SQLITE = 'sqlite',
  CAPACITOR_SQLITE = 'capacitor-sqlite'
}

/**
 * 数据库工厂类
 * 负责创建和管理数据库客户端实例
 */
export class DatabaseFactory {
  private static clientRegistry: Map<string, any> = new Map();
  
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
    const clientClass = this.clientRegistry.get(type.toLowerCase());
    
    if (!clientClass) {
      throw new Error(`未知的数据库客户端类型: ${type}`);
    }
    
    return new clientClass(config);
  }
  
  /**
   * 根据环境变量创建数据库客户端
   * @returns 数据库客户端实例
   */
  static createClientFromEnv(): IDatabaseClient {
    // 获取环境变量
    const dbType = process.env.DB_TYPE || 'mock';
    const dbName = process.env.DB_NAME || 'app-database';
    const dbVersion = parseInt(process.env.DB_VERSION || '1', 10);
    
    // 创建配置
    const config: DatabaseConfig = {
      name: dbName,
      version: dbVersion,
      engine: dbType as any // 添加 engine 属性
    };
    
    // 创建客户端
    return this.createClient(dbType, config);
  }
}

// 注册默认客户端类型
DatabaseFactory.registerClientType(DatabaseClientType.MOCK, MockDatabaseClient);
DatabaseFactory.registerClientType(DatabaseClientType.INDEXEDDB, IndexedDBClient);
DatabaseFactory.registerClientType(DatabaseClientType.SQLITE, SQLiteClient);
DatabaseFactory.registerClientType(DatabaseClientType.CAPACITOR_SQLITE, CapacitorSQLiteClient);