import { IBaseDatabaseClient } from '../interfaces';

/**
 * 数据库客户端抽象基类
 * 实现了 IBaseDatabaseClient 接口的基本框架
 */
export abstract class BaseClient implements IBaseDatabaseClient {
  protected initialized = false;
  
  // 生命周期方法
  abstract initialize(): Promise<void>;
  abstract close(): Promise<void>;
  abstract clear(): Promise<void>;
  
  // 通用数据访问接口
  abstract findById<T>(tableName: string, id: string): Promise<T | null>;
  abstract findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]>;
  abstract create<T extends { id: string }>(tableName: string, data: T): Promise<T>;
  abstract update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void>;
  abstract delete(tableName: string, id: string): Promise<void>;
  
  // 高级查询接口
  abstract query<T>(tableName: string, options: {
    select?: string[];
    where?: Record<string, any>;
    orderBy?: string | string[];
    limit?: number;
    offset?: number;
  }): Promise<T[]>;
  
  // 原始查询接口
  abstract executeRawQuery(query: string, params?: any[]): Promise<any>;
  
  // 事务支持
  abstract transaction<T>(callback: (trx: any) => Promise<T>): Promise<T>;
  
  // 辅助方法
  protected checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('数据库客户端未初始化');
    }
  }
  
  /**
   * 生成唯一ID
   * @returns 唯一ID字符串
   */
  protected generateId(): string {
    return crypto.randomUUID ? 
      crypto.randomUUID() : 
      Math.random().toString(36).substring(2, 15) + 
      Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * 添加创建和更新时间戳
   * @param data 要处理的数据对象
   * @param isUpdate 是否为更新操作
   * @returns 添加了时间戳的数据对象
   */
  protected addTimestamps<T extends { id: string, createdAt?: Date, updatedAt?: Date }, U extends boolean = false>(
    data: T, 
    isUpdate: U = false as U
  ): T & { updatedAt: Date } & (U extends true ? {} : { createdAt: Date }) {
    const now = new Date();
    
    if (!isUpdate) {
      // 创建操作，添加 createdAt
      return {
        ...data,
        createdAt: data.createdAt || now,
        updatedAt: now
      } as any;
    } else {
      // 更新操作，只更新 updatedAt
      return {
        ...data,
        updatedAt: now
      } as any;
    }
  }
  
  /**
   * 格式化查询条件
   * @param filter 过滤条件
   * @returns 格式化后的过滤条件
   */
  protected formatFilter(filter?: Record<string, any>): Record<string, any> {
    if (!filter) return {};
    
    // 移除所有 undefined 值
    return Object.entries(filter)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, any>);
  }
}