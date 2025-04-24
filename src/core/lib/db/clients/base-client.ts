console.log('base-client loaded');

import { QueryOptions, QueryResult, BatchOperation, DatabaseEvent, DatabaseError } from '@/core/lib/db/types/database';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { DatabaseErrorCode, createDatabaseError } from '@/core/lib/db/types/database-error';
import { getLoggerService } from '@/core/services/infrastructure/logger/registry/logger-registry';
import type { ILoggerService } from '@/core/services/infrastructure/logger';

/**
 * 数据库客户端抽象基类
 * 
 * @template T 实体类型，默认为 BaseEntity
 */
export abstract class BaseClient {
  protected initialized = false;
  protected transactionActive = false;
  protected eventListeners: Map<DatabaseEvent, Function[]> = new Map();

  protected logger: ILoggerService;

  constructor() {
    // 通过注册表获取 logger 实例
    this.logger = getLoggerService();
  }
  
  // 生命周期方法
  abstract initialize(): Promise<void>;
  abstract close(): Promise<void>;
  abstract clear(): Promise<void>;

  // 连接管理
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  // 通用数据访问接口
  abstract findById(tableName: string, id: string): Promise<BaseEntity | null>;
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
  
  /**
   * 检查数据库客户端是否已初始化
   * @throws {DatabaseError} 如果数据库客户端未初始化
   */
  protected checkInitialized(): void {
    if (!this.initialized) {
      throw this.createError(
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED,
        '数据库客户端未初始化'
      );
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
  protected addTimestamps(data: Partial<BaseEntity>): Partial<BaseEntity> {
    const now = new Date().toISOString();
    return {
      ...data,
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : now,
      updatedAt: now,
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

  /**
   * 检查事务是否处于活动状态
   * @throws {DatabaseError} 如果事务不处于活动状态
   */
  protected checkTransactionActive(): void {
    if (!this.transactionActive) {
      throw this.createError(
        DatabaseErrorCode.NO_ACTIVE_TRANSACTION,
        '没有活动的事务'
      );
    }
  }

  /**
   * 创建数据库错误
   * @param code 错误代码
   * @param message 错误消息
   * @param details 错误详情
   * @returns 数据库错误对象
   */
  protected createError(code: DatabaseErrorCode | string, message: string, details?: any): DatabaseError {
    const error = createDatabaseError(code, message, details);
    
    // 记录错误信息
    this.logger.error(message, { code, details });
    
    // 触发错误事件
    this.emit('error', { code, message, details });
    
    return error;
  }

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   * @returns 取消监听的函数
   */
  public on(event: DatabaseEvent, listener: Function): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(listener);
    this.logger.debug(`注册事件监听器: ${event}`);
    
    return () => {
      const listeners = this.eventListeners.get(event) || [];
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
        this.logger.debug(`移除事件监听器: ${event}`);
      }
    };
  }
  
  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  protected emit(event: DatabaseEvent, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    
    if (listeners.length > 0) {
      this.logger.debug(`触发事件: ${event}`, { listenerCount: listeners.length });
    }
    
    for (const listener of listeners) {
      try {
        listener(event, data);
      } catch (error) {
        this.logger.error(`事件监听器错误: ${event}`, error);
      }
    }
  }
}