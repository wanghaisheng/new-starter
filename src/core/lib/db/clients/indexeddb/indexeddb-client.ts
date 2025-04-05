import { BaseClient } from '@/core/lib/db/clients/base-client';
import { IDatabaseClient, DatabaseConfig, IDatabaseTransaction } from '@/core/lib/db/interfaces';
import { schemaRegistry } from '@/core/lib/db/schema/index';
import { IDBPDatabase, openDB, IDBPTransaction } from 'idb';
import { User, Match, Message } from '@/core/lib/db/types';
import { IndexDefinition } from '@/core/lib/db/schema/types';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { QueryOptions, QueryResult, BatchOperation, DatabaseEvent } from '@/core/lib/db/types/database.types';
import { DatabaseError, DatabaseErrorCode } from '@/core/lib/db/errors/database-error';

// Update DatabaseEvent type to include 'performance'
// This extends the existing type declared in database.types.ts
declare global {
  interface DatabaseEventMap {
    performance: {
      operation: string;
      duration: number;
      error?: boolean;
      timestamp: Date;
    };
  }
}

/**
 * IndexedDB数据库客户端配置接口
 */
export interface IndexedDBConfig extends DatabaseConfig {
  /**
   * 缓存超时时间（毫秒）
   * @default 300000 (5分钟)
   */
  cacheTimeout?: number;

  /**
   * 是否启用查询缓存
   * @default true
   */
  enableQueryCache?: boolean;

  /**
   * 是否启用实体缓存
   * @default true
   */
  enableEntityCache?: boolean;
}

/**
 * 优化版 IndexedDB 数据库客户端
 * 实现了IDatabaseClient接口，使用IndexedDB作为存储后端
 * 包含性能优化：
 * 1. 使用 idb 库提供的类型安全和Promise包装
 * 2. 实现内存缓存
 * 3. 支持批量操作
 * 4. 支持索引查询
 */
export class IndexedDBClient extends BaseClient implements IDatabaseClient {
  private db: IDBPDatabase | null = null;
  private config: IndexedDBConfig;
  private cache: Map<string, Map<string, any>> = new Map();
  private queryCache: Map<string, { data: any[], timestamp: number }> = new Map();
  private cacheTimeout: number;
  private enableQueryCache: boolean;
  private enableEntityCache: boolean;

  /**
   * 构造函数
   * @param config 数据库配置
   */
  constructor(config: IndexedDBConfig) {
    super();
    this.config = config;
    this.cacheTimeout = config.cacheTimeout ?? 5 * 60 * 1000; // 默认5分钟
    this.enableQueryCache = config.enableQueryCache ?? true;
    this.enableEntityCache = config.enableEntityCache ?? true;
    
    this.logger.debug('IndexedDBClient配置', {
      name: this.config.name,
      version: this.config.version,
      cacheTimeout: this.cacheTimeout,
      enableQueryCache: this.enableQueryCache,
      enableEntityCache: this.enableEntityCache
    });
  }

  /**
   * 初始化数据库连接
   * 创建数据库结构并打开连接
   */
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        throw this.createError(
          DatabaseErrorCode.CLIENT_ALREADY_INITIALIZED,
          'IndexedDB客户端已初始化'
        );
      }

      this.db = await openDB(this.config.name || 'app-database', this.config.version || 1, {
        upgrade: (db) => {
          try {
            const schemas = schemaRegistry.getAllSchemas();
            for (const schema of schemas) {
              if (!db.objectStoreNames.contains(schema.name)) {
                const store = db.createObjectStore(schema.name, { keyPath: 'id' });
                if (schema.indexes) {
                  for (const index of schema.indexes) {
                    store.createIndex(index.name, index.columns, { unique: index.unique });
                  }
                }
              }
            }
            this.logger.info('数据库模式升级成功', { version: this.config.version });
          } catch (error) {
            this.logger.error('数据库模式升级失败', error);
            throw error;
          }
        },
      });

      this.initialized = true;
      this.emit('initialized');
      this.logger.info(`IndexedDB数据库 "${this.config.name}" 初始化成功`, {
        version: this.config.version,
        tables: Array.from(this.db.objectStoreNames)
      });
    } catch (error) {
      const dbError = this.createError(
        DatabaseErrorCode.INITIALIZATION_ERROR,
        `IndexedDB初始化失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
      this.logger.error('IndexedDB初始化失败', { error: dbError });
      throw dbError;
    }
  }

  /**
   * 关闭数据库连接
   * 释放资源并清除缓存
   */
  async close(): Promise<void> {
    try {
      this.checkInitialized();
      
      if (this.db) {
        this.db.close();
        this.db = null;
        this.initialized = false;
        this.cache.clear();
        this.queryCache.clear();
        this.emit('closed');
        this.logger.info('IndexedDB数据库连接已关闭');
      }
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.CONNECTION_ERROR,
        `关闭数据库连接失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 清空数据库内容
   * 清除所有表中的数据但保留表结构
   */
  async clear(): Promise<void> {
    try {
      this.checkInitialized();
      
      const schemas = schemaRegistry.getAllSchemas();
      for (const schema of schemas) {
        const store = this.db!.transaction(schema.name, 'readwrite').objectStore(schema.name);
        await store.clear();
      }
      
      this.cache.clear();
      this.queryCache.clear();
      this.logger.info('IndexedDB数据库内容已清空');
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `清空数据库失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 通过ID查找记录
   * @param tableName 表名
   * @param id 记录ID
   * @returns 记录对象或null（如果不存在）
   */
  async findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null> {
    try {
      this.checkInitialized();
      
      return this.measurePerformance(`findById:${tableName}`, async () => {
        // 检查缓存
        if (this.enableEntityCache) {
          const cache = this.getTableCache(tableName);
          const cached = cache.get(id);
          if (cached) {
            this.logger.debug(`从缓存读取记录: ${tableName}/${id}`);
            return this.processResult<T>(cached);
          }
        }

        const result = await this.db!.get(tableName, id);
        
        if (result) {
          const processed = this.processResult<T>(result);
          
          // 更新缓存
          if (this.enableEntityCache) {
            const cache = this.getTableCache(tableName);
            cache.set(id, processed);
          }
          
          return processed;
        }
        
        return null;
      });
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `查询记录失败: ${tableName}/${id}`,
        error
      );
    }
  }

  /**
   * 查找表中的所有记录
   * @param tableName 表名
   * @param filter 过滤条件
   * @returns 记录数组
   */
  async findAll<T extends BaseEntity>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    try {
      this.checkInitialized();
      
      return this.measurePerformance(`findAll:${tableName}`, async () => {
        // 如果有过滤条件，使用query方法
        if (filter && Object.keys(filter).length > 0) {
          const result = await this.query<T>(tableName, { where: filter });
          return result.data;
        }
        
        // 检查缓存
        if (this.enableEntityCache) {
          const cache = this.getTableCache(tableName);
          if (cache.size > 0) {
            this.logger.debug(`从缓存读取所有记录: ${tableName}`);
            return Array.from(cache.values()).map(item => this.processResult<T>(item));
          }
        }

        const results = await this.db!.getAll(tableName);
        const processed = results.map(item => this.processResult<T>(item));
        
        // 更新缓存
        if (this.enableEntityCache) {
          const cache = this.getTableCache(tableName);
          results.forEach(item => {
            if (item.id) {
              cache.set(item.id, item);
            }
          });
        }
        
        return processed;
      });
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `查询所有记录失败: ${tableName}`,
        error
      );
    }
  }

  /**
   * 创建新记录
   * @param tableName 表名
   * @param data 记录数据
   * @returns 创建的记录
   */
  async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    try {
      this.checkInitialized();
      
      return this.measurePerformance(`create:${tableName}`, async () => {
        const now = new Date();
        const record = {
          ...data,
          id: data.id || this.generateId(),
          createdAt: data.createdAt || now,
          updatedAt: now
        };
        
        await this.db!.add(tableName, record);
        
        // 更新缓存
        if (this.enableEntityCache) {
          const cache = this.getTableCache(tableName);
          cache.set(record.id, record);
        }
        
        this.logger.info(`记录已创建: ${tableName}/${record.id}`);
        return this.processResult<T>(record);
      });
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `创建记录失败: ${tableName}`,
        error
      );
    }
  }

  /**
   * 更新记录
   * @param tableName 表名
   * @param id 记录ID
   * @param data 要更新的数据
   */
  async update<T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    try {
      this.checkInitialized();
      
      await this.measurePerformance(`update:${tableName}`, async () => {
        const existing = await this.db!.get(tableName, id);
        if (!existing) {
          throw this.createError(
            DatabaseErrorCode.NOT_FOUND,
            `记录不存在: ${tableName}/${id}`
          );
        }
        
        const record = {
          ...existing,
          ...data,
          id,
          updatedAt: new Date()
        };
        
        await this.db!.put(tableName, record);
        
        // 更新缓存
        if (this.enableEntityCache) {
          const cache = this.getTableCache(tableName);
          cache.set(id, record);
        }
        
        this.logger.info(`记录已更新: ${tableName}/${id}`);
      });
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `更新记录失败: ${tableName}/${id}`,
        error
      );
    }
  }

  /**
   * 删除记录
   * @param tableName 表名
   * @param id 记录ID
   */
  async delete(tableName: string, id: string): Promise<void> {
    try {
      this.checkInitialized();
      
      await this.measurePerformance(`delete:${tableName}`, async () => {
        // 检查记录是否存在
        const existing = await this.db!.get(tableName, id);
        if (!existing) {
          throw this.createError(
            DatabaseErrorCode.NOT_FOUND,
            `记录不存在: ${tableName}/${id}`
          );
        }
        
        await this.db!.delete(tableName, id);
        
        // 更新缓存
        if (this.enableEntityCache) {
          const cache = this.getTableCache(tableName);
          cache.delete(id);
        }
        
        this.logger.info(`记录已删除: ${tableName}/${id}`);
      });
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `删除记录失败: ${tableName}/${id}`,
        error
      );
    }
  }

  /**
   * 执行高级查询
   * @param tableName 表名
   * @param options 查询选项
   * @returns 查询结果
   */
  async query<T extends BaseEntity>(tableName: string, options: QueryOptions): Promise<QueryResult<T>> {
    try {
      this.checkInitialized();
      
      return this.measurePerformance(`query:${tableName}`, async () => {
        // 检查缓存
        if (this.enableQueryCache) {
          const cacheKey = this.generateCacheKey(tableName, options);
          const cached = this.queryCache.get(cacheKey);
          if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            this.logger.debug(`从缓存读取查询结果: ${cacheKey}`);
            return {
              data: cached.data as T[],
              total: cached.data.length,
              hasMore: false
            };
          }
        }

        let results: T[] = [];
        
        // 使用索引优化查询
        const schema = schemaRegistry.getSchema(tableName);
        if (schema?.indexes && options.where) {
          const indexMatch = this.findMatchingIndex(schema.indexes, options.where);
          if (indexMatch) {
            this.logger.debug(`使用索引进行查询: ${tableName}/${indexMatch.name}`);
            results = await this.queryUsingIndex<T>(tableName, indexMatch, options.where);
          } else {
            results = await this.findAll<T>(tableName);
          }
        } else {
          results = await this.findAll<T>(tableName);
        }
        
        const total = results.length;
        let processedResults = this.processQueryResults(results, options);
        
        // 更新缓存
        if (this.enableQueryCache) {
          const cacheKey = this.generateCacheKey(tableName, options);
          this.updateQueryCache(cacheKey, processedResults);
        }
        
        // 确定是否有更多结果
        let hasMore = false;
        if (options.limit !== undefined && options.offset !== undefined) {
          hasMore = total > (options.offset + options.limit);
        }
        
        return {
          data: processedResults,
          total,
          hasMore
        };
      });
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `查询失败: ${tableName}`,
        error
      );
    }
  }

  /**
   * 统计记录数量
   * @param tableName 表名
   * @param filter 过滤条件
   * @returns 记录数量
   */
  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    try {
      this.checkInitialized();
      
      return this.measurePerformance(`count:${tableName}`, async () => {
        if (!filter || Object.keys(filter).length === 0) {
          // 如果没有过滤条件，直接使用count()方法
          return await this.db!.count(tableName);
        }
        
        // 有过滤条件时，需要先获取所有记录再过滤
        const results = await this.findAll(tableName);
        return filter ? results.filter(item => this.matchesFilter(item, filter)).length : results.length;
      });
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `统计记录数量失败: ${tableName}`,
        error
      );
    }
  }

  // 实现特定实体方法
  /**
   * 查找用户
   * @param query 查询条件
   * @returns 用户列表
   */
  async findUsers(query?: any): Promise<User[]> {
    try {
      const result = await this.query<User>('users', { where: query });
      return result.data;
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        '查询用户失败',
        error
      );
    }
  }

  /**
   * 查找匹配
   * @param query 查询条件
   * @returns 匹配列表
   */
  async findMatches(query?: any): Promise<Match[]> {
    try {
      const result = await this.query<Match>('matches', { where: query });
      return result.data;
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        '查询匹配失败',
        error
      );
    }
  }

  /**
   * 查找消息
   * @param query 查询条件
   * @returns 消息列表
   */
  async findMessages(query?: any): Promise<Message[]> {
    try {
      const result = await this.query<Message>('messages', { where: query });
      return result.data;
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        '查询消息失败',
        error
      );
    }
  }

  /**
   * 创建用户
   * @param data 用户数据
   * @returns 创建的用户
   */
  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.create<User>('users', data as User);
  }

  /**
   * 创建匹配
   * @param data 匹配数据
   * @returns 创建的匹配
   */
  async createMatch(data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
    return this.create<Match>('matches', data as Match);
  }

  /**
   * 创建消息
   * @param data 消息数据
   * @returns 创建的消息
   */
  async createMessage(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    return this.create<Message>('messages', data as Message);
  }

  /**
   * 更新用户
   * @param id 用户ID
   * @param data 更新的数据
   */
  async updateUser(id: string, data: Partial<User>): Promise<void> {
    return this.update<User>('users', id, data);
  }

  /**
   * 更新匹配
   * @param id 匹配ID
   * @param data 更新的数据
   */
  async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    return this.update<Match>('matches', id, data);
  }

  /**
   * 更新消息
   * @param id 消息ID
   * @param data 更新的数据
   */
  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    return this.update<Message>('messages', id, data);
  }

  /**
   * 删除用户
   * @param id 用户ID
   */
  async deleteUser(id: string): Promise<void> {
    return this.delete('users', id);
  }

  /**
   * 删除匹配
   * @param id 匹配ID
   */
  async deleteMatch(id: string): Promise<void> {
    return this.delete('matches', id);
  }

  /**
   * 删除消息
   * @param id 消息ID
   */
  async deleteMessage(id: string): Promise<void> {
    return this.delete('messages', id);
  }

  // 事务相关方法
  /**
   * 开始事务
   * @remarks
   * IndexedDB使用自动事务管理，此方法仅提供兼容性，不执行实际操作
   */
  async beginTransaction(): Promise<void> {
    this.logger.warn('IndexedDB使用自动事务管理，不需要手动开始事务');
    this.transactionActive = true;
  }

  /**
   * 提交事务
   * @remarks
   * IndexedDB使用自动事务管理，此方法仅提供兼容性，不执行实际操作
   */
  async commitTransaction(): Promise<void> {
    this.logger.warn('IndexedDB使用自动事务管理，不需要手动提交事务');
    this.transactionActive = false;
  }

  /**
   * 回滚事务
   * @remarks
   * IndexedDB使用自动事务管理，此方法仅提供兼容性，不执行实际操作
   */
  async rollbackTransaction(): Promise<void> {
    this.logger.warn('IndexedDB使用自动事务管理，不需要手动回滚事务');
    this.transactionActive = false;
  }

  /**
   * 执行原始查询
   * @param query 查询语句
   * @param params 查询参数
   * @throws {DatabaseError} IndexedDB不支持原始查询
   */
  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    throw this.createError(
      DatabaseErrorCode.OPERATION_FAILED,
      'IndexedDB不支持原始查询'
    );
  }

  /**
   * 在事务中执行操作
   * @param callback 事务回调函数
   * @returns 回调函数的返回值
   */
  async transaction<T>(callback: (trx: IDatabaseTransaction) => Promise<T>): Promise<T> {
    try {
      this.checkInitialized();
      
      return this.measurePerformance('transaction', async () => {
        // 获取所有对象存储的名称
        const storeNames = Array.from(this.db!.objectStoreNames);
        const tx = this.db!.transaction(storeNames, 'readwrite');
        
        try {
          // 将事务传递给回调函数
          const result = await callback(this);
          
          // 等待事务完成
          await tx.done;
          
          return result;
        } catch (error) {
          // 发生错误时中止事务
          tx.abort();
          throw error;
        }
      });
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_ERROR,
        `事务执行失败: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 批量操作
   * @param tableName 表名
   * @param operations 操作列表
   */
  async batch<T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    try {
      this.checkInitialized();
      
      await this.measurePerformance(`batch:${tableName}`, async () => {
        const tx = this.db!.transaction(tableName, 'readwrite');
        const store = tx.objectStore(tableName);

        for (const op of operations) {
          try {
            switch (op.type) {
              case 'add':
                // 确保记录有ID和时间戳
                const addData = {
                  ...op.data,
                  id: op.data.id || this.generateId(),
                  createdAt: op.data.createdAt || new Date(),
                  updatedAt: new Date()
                };
                await store.add(addData);
                break;
              case 'put':
                // 确保记录有更新时间
                const putData = {
                  ...op.data,
                  updatedAt: new Date()
                };
                await store.put(putData);
                break;
              case 'delete':
                await store.delete(op.data.id);
                break;
              default:
                throw this.createError(
                  DatabaseErrorCode.INVALID_DATA,
                  `不支持的批量操作类型: ${(op as any).type}`
                );
            }
          } catch (opError) {
            // 单个操作失败时，中止整个事务
            throw opError;
          }
        }

        // 等待事务完成
        await tx.done;
        
        // 清除相关缓存
        this.invalidateCache(tableName);
        
        this.logger.info(`批量操作完成: ${tableName}`, { operationCount: operations.length });
      });
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `批量操作失败: ${tableName}`,
        error
      );
    }
  }

  /**
   * 清除特定表的缓存
   * @param tableName 表名
   */
  clearTableCache(tableName: string): void {
    this.invalidateCache(tableName);
    this.logger.debug(`已清除表缓存: ${tableName}`);
  }

  /**
   * 清除所有缓存
   */
  clearAllCaches(): void {
    this.cache.clear();
    this.queryCache.clear();
    this.logger.debug('已清除所有缓存');
  }

  /**
   * 测量操作性能
   * @param operation 操作名称
   * @param callback 要执行的操作
   * @returns 操作结果
   */
  protected async measurePerformance<T>(operation: string, callback: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await callback();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.logger.debug(`性能: ${operation} 完成，耗时 ${duration.toFixed(2)}ms`);
      
      // 触发性能事件
      this.emit('performance' as DatabaseEvent, {
        operation,
        duration,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.logger.debug(`性能: ${operation} 失败，耗时 ${duration.toFixed(2)}ms`);
      
      // 错误情况也触发性能事件
      this.emit('performance' as DatabaseEvent, {
        operation,
        duration,
        error: true,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  // 私有辅助方法
  /**
   * 处理查询结果，转换日期字符串等
   * @param record 数据记录
   * @returns 处理后的记录
   */
  private processResult<T>(record: any): T {
    if (!record) return record;
    
    const processed = { ...record };
    
    // 处理日期字段
    for (const key in processed) {
      if (Object.prototype.hasOwnProperty.call(processed, key)) {
        const value = processed[key];
        
        // 处理ISO日期字符串
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(value)) {
          processed[key] = new Date(value);
        }
        // 处理Date对象
        else if (value && typeof value === 'object' && value instanceof Date) {
          // 保留Date对象
          processed[key] = value;
        }
        // 递归处理嵌套对象
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
          processed[key] = this.processResult(value);
        }
      }
    }
    
    return processed as T;
  }

  /**
   * 检查记录是否匹配过滤条件
   * @param item 记录
   * @param filter 过滤条件
   * @returns 是否匹配
   */
  private matchesFilter(item: any, filter: Record<string, any>): boolean {
    if (!filter) return true;
    
    return Object.entries(filter).every(([key, value]) => {
      // 处理特殊操作符
      if (key === '$or' && Array.isArray(value)) {
        return value.some((subFilter: Record<string, any>) => 
          this.matchesFilter(item, subFilter)
        );
      }
      
      if (key === '$and' && Array.isArray(value)) {
        return value.every((subFilter: Record<string, any>) => 
          this.matchesFilter(item, subFilter)
        );
      }
      
      if (typeof value === 'object' && value !== null) {
        if ('$contains' in value) {
          return Array.isArray(item[key]) && item[key].includes(value.$contains);
        }
        
        if ('$in' in value && Array.isArray(value.$in)) {
          return value.$in.includes(item[key]);
        }
        
        if ('$gt' in value) {
          return item[key] > value.$gt;
        }
        
        if ('$gte' in value) {
          return item[key] >= value.$gte;
        }
        
        if ('$lt' in value) {
          return item[key] < value.$lt;
        }
        
        if ('$lte' in value) {
          return item[key] <= value.$lte;
        }
        
        if ('$ne' in value) {
          return item[key] !== value.$ne;
        }
      }
      
      // 普通比较
      return item[key] === value;
    });
  }

  /**
   * 获取表缓存
   * @param tableName 表名
   * @returns 表缓存Map
   */
  private getTableCache(tableName: string): Map<string, any> {
    if (!this.cache.has(tableName)) {
      this.cache.set(tableName, new Map());
    }
    return this.cache.get(tableName)!;
  }

  /**
   * 清除表缓存
   * @param tableName 表名
   */
  private invalidateCache(tableName: string): void {
    this.cache.delete(tableName);
    
    // 清除相关的查询缓存
    const keysToDelete = Array.from(this.queryCache.keys())
      .filter(key => key.startsWith(tableName));
    keysToDelete.forEach(key => this.queryCache.delete(key));
    
    this.logger.debug(`已清除表缓存: ${tableName}`);
  }

  /**
   * 生成查询缓存键
   * @param tableName 表名
   * @param options 查询选项
   * @returns 缓存键
   */
  private generateCacheKey(tableName: string, options: QueryOptions): string {
    return `${tableName}:${JSON.stringify(options)}`;
  }

  /**
   * 更新查询缓存
   * @param key 缓存键
   * @param data 缓存数据
   */
  private updateQueryCache(key: string, data: any[]): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 查找匹配的索引
   * @param indexes 索引定义
   * @param query 查询条件
   * @returns 匹配的索引或null
   */
  private findMatchingIndex(indexes: IndexDefinition[], query: any): IndexDefinition | null {
    return indexes.find(index => 
      index.columns.every(col => query[col] !== undefined)
    ) || null;
  }

  /**
   * 使用索引进行查询
   * @param tableName 表名
   * @param index 索引定义
   * @param query 查询条件
   * @returns 查询结果
   */
  private async queryUsingIndex<T>(
    tableName: string,
    index: IndexDefinition,
    query: Record<string, any>
  ): Promise<T[]> {
    const tx = this.db!.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    const indexStore = store.index(index.name);
    
    // 构建索引键
    const key = index.columns.length === 1 
      ? query[index.columns[0]] 
      : index.columns.map(col => query[col]);
    
    // 使用索引进行查询
    const results = await indexStore.getAll(key);
    return results.map(item => this.processResult<T>(item));
  }

  /**
   * 处理查询结果
   * @param results 查询结果
   * @param options 查询选项
   * @returns 处理后的结果
   */
  private processQueryResults<T>(results: T[], options: QueryOptions): T[] {
    let processed = results;

    // 应用过滤条件
    if (options.where) {
      processed = processed.filter(item => this.matchesFilter(item, options.where!));
    }

    // 应用排序
    if (options.orderBy) {
      const { field, direction } = options.orderBy;
      processed.sort((a, b) => {
        const aValue = (a as any)[field];
        const bValue = (b as any)[field];
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 应用分页
    if (options.limit !== undefined || options.offset !== undefined) {
      const start = options.offset || 0;
      const end = options.limit !== undefined ? start + options.limit : undefined;
      processed = processed.slice(start, end);
    }

    return processed;
  }
} 