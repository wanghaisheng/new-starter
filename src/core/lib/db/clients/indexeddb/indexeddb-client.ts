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
        upgrade: (db) => this.upgradeDatabase(db),
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
   * @param collection 表名
   * @param id 记录ID
   * @returns 记录对象或null（如果不存在）
   */
  async findById<T>(collection: string, id: string): Promise<T | null> {
    try {
      this.checkInitialized();
      
      const store = this.db!.transaction(collection, 'readonly').objectStore(collection);
      const result = await store.get(id);
      
      if (!result) return null;
      
      return this.processResult<T>(result);
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `Failed to find record by ID: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 查找表中的所有记录
   * @param collection 表名
   * @param filter 过滤条件
   * @returns 记录数组
   */
  async findAll<T>(collection: string, filter?: Record<string, any>): Promise<T[]> {
    try {
      this.checkInitialized();
      
      const store = this.db!.transaction(collection, 'readonly').objectStore(collection);
      const results = await store.getAll();
      
      const processedResults = results.map(result => this.processResult<T>(result));
      
      if (filter) {
        return processedResults.filter(item => this.matchesFilter(item, filter));
      }
      
      return processedResults;
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `Failed to find all records: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 创建新记录
   * @param collection 表名
   * @param data 记录数据
   * @returns 创建的记录
   */
  async create<T>(collection: string, data: Partial<T>): Promise<T> {
    try {
      this.checkInitialized();
      
      const store = this.db!.transaction(collection, 'readwrite').objectStore(collection);
      const now = new Date();
      const record = {
        ...data,
        id: (data as any).id || this.generateId(),
        createdAt: now,
        updatedAt: now
      };
      
      await store.add(record);
      return record as T;
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `Failed to create record: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 更新记录
   * @param collection 表名
   * @param id 记录ID
   * @param data 要更新的数据
   */
  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    try {
      this.checkInitialized();
      
      const store = this.db!.transaction(collection, 'readwrite').objectStore(collection);
      const existing = await store.get(id);
      
      if (!existing) {
        throw this.createError(
          DatabaseErrorCode.NOT_FOUND,
          `Record not found with ID: ${id}`
        );
      }
      
      const updatedData = {
        ...existing,
        ...data,
        id,
        updatedAt: new Date()
      };
      
      await store.put(updatedData);
      return updatedData as T;
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `Failed to update record: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 删除记录
   * @param collection 表名
   * @param id 记录ID
   */
  async delete(collection: string, id: string): Promise<boolean> {
    try {
      this.checkInitialized();
      
      const store = this.db!.transaction(collection, 'readwrite').objectStore(collection);
      await store.delete(id);
      return true;
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `Failed to delete record: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 执行高级查询
   * @param collection 表名
   * @param query 查询条件
   * @returns 查询结果
   */
  async query<T>(collection: string, query: any): Promise<QueryResult<T>> {
    try {
      this.checkInitialized();
      
      const store = this.db!.transaction(collection, 'readonly').objectStore(collection);
      let results = await store.getAll();
      
      if (query.where) {
        results = results.filter(item => this.matchesFilter(item, query.where));
      }
      
      if (query.orderBy) {
        const { field, direction } = query.orderBy;
        results.sort((a, b) => {
          const aValue = a[field];
          const bValue = b[field];
          
          if (aValue === bValue) return 0;
          const comparison = aValue < bValue ? -1 : 1;
          return direction === 'asc' ? comparison : -comparison;
        });
      }
      
      const total = results.length;
      let processedResults = results.map(result => this.processResult<T>(result));
      
      if (query.limit !== undefined || query.offset !== undefined) {
        const start = query.offset || 0;
        const end = query.limit !== undefined ? start + query.limit : undefined;
        processedResults = processedResults.slice(start, end);
      }
      
      return {
        data: processedResults,
        total,
        hasMore: total > (processedResults.length + (query.offset || 0))
      };
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * 统计记录数量
   * @param collection 表名
   * @param filter 过滤条件
   * @returns 记录数量
   */
  async count(collection: string, filter?: Record<string, any>): Promise<number> {
    try {
      this.checkInitialized();
      
      return await this.measurePerformance(`count:${collection}`, async () => {
        const store = this.db!.transaction(collection, 'readonly').objectStore(collection);
        const results = await store.getAll();
        
        if (filter) {
          return results.filter(item => this.matchesFilter(item, filter)).length;
        }
        
        return results.length;
      });
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `统计记录数量失败: ${collection}`,
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
   * @param collection 表名
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
    if (options.filter) {
      processed = processed.filter(item => this.matchesFilter(item, options.filter!));
    }

    // 应用排序
    if (options.sort) {
      const { field, order } = options.sort;
      processed.sort((a, b) => {
        const aValue = (a as any)[field];
        const bValue = (b as any)[field];
        
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 应用分页
    if (options.page && options.pageSize) {
      const start = (options.page - 1) * options.pageSize;
      processed = processed.slice(start, start + options.pageSize);
    }

    return processed;
  }

  private getFromCache<T>(tableName: string, id: string): T | null {
    if (!this.enableEntityCache) return null;
    
    const tableCache = this.cache.get(tableName);
    if (!tableCache) return null;
    
    const item = tableCache.get(id);
    if (!item) return null;
    
    return item as T;
  }

  private addToCache<T>(tableName: string, id: string, data: T): void {
    if (!this.enableEntityCache) return;
    
    let tableCache = this.cache.get(tableName);
    if (!tableCache) {
      tableCache = new Map();
      this.cache.set(tableName, tableCache);
    }
    
    tableCache.set(id, data);
  }

  private removeFromCache(tableName: string, id: string): void {
    const tableCache = this.cache.get(tableName);
    if (tableCache) {
      tableCache.delete(id);
    }
  }

  private upgradeDatabase(db: IDBPDatabase): void {
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
    } catch (error) {
      throw this.createError(
        DatabaseErrorCode.INITIALIZATION_ERROR,
        `Failed to upgrade database: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  async connect(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async disconnect(): Promise<void> {
    await this.close();
  }

  // Helper method to determine if the call is from BaseClient
  private isBaseClientCall(): boolean {
    // This is a simplified check. In a real implementation, you might want to use
    // more sophisticated methods to determine the caller
    const stack = new Error().stack || '';
    return stack.includes('BaseClient');
  }
} 