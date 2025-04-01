import { IBaseDatabaseClient, IDatabaseTransaction } from '../interfaces';
import { QueryOptions, QueryResult, BatchOperation } from '../types/database.types';
import { BaseEntity } from '../types/base-entity';

/**
 * 数据库客户端抽象基类
 * 实现了 IBaseDatabaseClient 接口的基本框架
 */
export abstract class BaseClient implements IBaseDatabaseClient<BaseEntity> {
  protected initialized = false;
  
  // 生命周期方法
  abstract initialize(): Promise<void>;
  abstract close(): Promise<void>;
  abstract clear(): Promise<void>;
  
  // 通用数据访问接口
  abstract findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null>;
  abstract findAll(tableName: string, filter?: Record<string, any>): Promise<BaseEntity[]>;
  abstract create(tableName: string, data: BaseEntity): Promise<BaseEntity>;
  abstract update(tableName: string, id: string, data: Partial<BaseEntity>): Promise<void>;
  abstract delete(tableName: string, id: string): Promise<void>;
  
  // 高级查询接口
  abstract query(tableName: string, options: QueryOptions): Promise<QueryResult<BaseEntity>>;
  abstract count(tableName: string, filter?: Record<string, any>): Promise<number>;
  
  // 事务支持
  abstract beginTransaction(): Promise<void>;
  abstract commitTransaction(): Promise<void>;
  abstract rollbackTransaction(): Promise<void>;
  
  // 批量操作
  abstract batch(tableName: string, operations: BatchOperation<BaseEntity>[]): Promise<void>;
  
  // 原始查询
  abstract executeRawQuery<R>(query: string, params?: any[]): Promise<R[]>;
  
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
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
  
  /**
   * 添加时间戳
   * @param data 实体数据
   * @returns 添加时间戳后的实体数据
   */
  protected addTimestamps<T extends BaseEntity>(data: Partial<T>): Partial<T> {
    return {
      ...data,
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }
  
  /**
   * 格式化过滤条件
   * @param filter 原始过滤条件
   * @returns 格式化后的过滤条件
   */
  protected formatFilter(filter?: Record<string, any>): Record<string, any> {
    if (!filter) return {};
    
    return Object.entries(filter).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  }
}