import { eq, and, or, sql } from 'drizzle-orm';
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';

import { BaseClient } from '@/core/lib/db/clients/base-client';
import { DatabaseErrorCode } from '@/core/lib/db/errors/database-error';
import { IDatabaseClient, IDatabaseTransaction } from '@/core/lib/db/interfaces';
import { drizzleSchema } from '@/core/lib/db/schema/drizzle-schema';
import { User, Match, Message } from '@/core/lib/db/types';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database';

import { CloudflareD1Config, D1Database, D1Result } from './cloudflare-d1-config';

// Drizzle ORM 导入


// 为Cloudflare Workers环境中的D1Database添加类型声明
declare global {
  var D1Database: any;
}

/**
 * Cloudflare D1 数据库客户端
 * 用于 Cloudflare Workers 环境的 D1 数据库
 */
export class CloudflareD1Client extends BaseClient implements IDatabaseClient {
  private d1: D1Database | null = null;
  private dbName: string;
  private dbVersion: number;
  
  // Drizzle ORM 实例
  private drizzleDB: DrizzleD1Database<any> | null = null;

  constructor(private config: CloudflareD1Config) {
    super();
    this.dbName = config.name || 'app-database';
    this.dbVersion = config.version || 1;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 检查是否在 Cloudflare Workers 环境中
      if (typeof globalThis.D1Database === 'undefined') {
        this.logger.warn('当前环境不支持 Cloudflare D1 数据库，使用模拟模式');
      }

      // 获取 D1 数据库实例
      this.d1 = this.config.d1Instance as D1Database;
      if (!this.d1) {
        throw this.createError(
          DatabaseErrorCode.INITIALIZATION_ERROR,
          '未提供 D1 数据库实例'
        );
      }

      // 初始化 Drizzle ORM
      if (this.config.useDrizzle !== false) {
        this.initializeDrizzle();
      }

      this.initialized = true;
      this.logger.info(`Cloudflare D1 数据库 "${this.dbName}" 初始化成功`);
    } catch (error) {
      this.logger.error('Cloudflare D1 初始化失败:', error);
      throw this.createError(
        DatabaseErrorCode.INITIALIZATION_ERROR,
        'Cloudflare D1 初始化失败',
        error
      );
    }
  }

  async close(): Promise<void> {
    // D1 不需要显式关闭连接
    this.d1 = null;
    this.drizzleDB = null;
    this.initialized = false;
    this.logger.info('Cloudflare D1 客户端已关闭');
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    
    try {
      // 清空所有表
      const tables = Object.keys(this.config.tables || {});
      
      for (const tableName of tables) {
        await this.executeRawQuery(`DELETE FROM ${tableName}`);
      }
      
      this.logger.info('已清空 Cloudflare D1 数据库所有表');
    } catch (error) {
      this.logger.error('清空数据库失败:', error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        '清空数据库失败',
        error
      );
    }
  }

  // 通用数据访问方法
  async findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    
    try {
      // 使用 Drizzle ORM 查询
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        const result = await this.drizzleDB
          .select()
          .from(table)
          .where(eq(table.id as any, id))
          .get();
        
        return result ? this.processResult<T>(result) : null;
      }
      
      // 回退到原生 SQL 查询
      const results = await this.executeRawQuery<T>(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [id]
      );
      
      return results.length > 0 ? this.processResult<T>(results[0]) : null;
    } catch (error) {
      this.logger.error(`查询失败 (${tableName}/${id})`, error);
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `查询失败 (${tableName}/${id})`,
        error
      );
    }
  }

  async findAll<T extends BaseEntity>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    
    try {
      // 使用 Drizzle ORM 查询
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        let query = this.drizzleDB.select().from(table);
        
        // 应用过滤条件
        if (filter && Object.keys(filter).length > 0) {
          const conditions = Object.entries(filter)
            .map(([key, value]) => sql`${sql.raw(key)} = ${value}`)
            .reduce((prev, curr) => prev ? and(prev, curr) : curr, undefined);
          if (conditions) {
            query = query.where(conditions) as any;
          }
        }
        
        const results = await query.all();
        return results.map(result => this.processResult<T>(result));
      }
      
      // 回退到原生 SQL 查询
      let queryStr = `SELECT * FROM ${tableName}`;
      const params: any[] = [];
      
      // 应用过滤条件
      if (filter && Object.keys(filter).length > 0) {
        const conditions = Object.entries(filter)
          .map(([key, value]) => {
            params.push(value);
            return `${key} = ?`;
          })
          .join(' AND ');
        
        if (conditions) {
          queryStr += ` WHERE ${conditions}`;
        }
      }
      
      const results = await this.executeRawQuery<T>(queryStr, params);
      return results.map(result => this.processResult<T>(result));
    } catch (error) {
      this.logger.error(`查询失败 (${tableName})`, error);
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `查询失败 (${tableName})`,
        error
      );
    }
  }

  async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    
    // 确保有 ID
    if (!data.id) {
      data.id = this.generateId();
    }
    
    // 添加时间戳
    const itemWithTimestamps = this.addTimestamps(data);
    
    try {
      // 使用 Drizzle ORM 插入
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        await this.drizzleDB.insert(table).values(itemWithTimestamps as any).run();
        // 这里使用类型断言，确保返回类型符合泛型T
        return itemWithTimestamps as T;
      }
      
      // 回退到原生 SQL 查询
      const keys = Object.keys(itemWithTimestamps);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(key => (itemWithTimestamps as any)[key]);
      
      await this.executeRawQuery(
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
      
      // 这里使用类型断言，确保返回类型符合泛型T
      return itemWithTimestamps as T;
    } catch (error) {
      this.logger.error(`创建失败 (${tableName})`, error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `创建失败 (${tableName})`,
        error
      );
    }
  }

  async update<T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    
    try {
      // 先获取现有数据
      const existing = await this.findById<T>(tableName, id);
      if (!existing) {
        throw this.createError(
          DatabaseErrorCode.NOT_FOUND,
          `更新失败: 找不到 ID 为 ${id} 的记录`
        );
      }
      
      // 添加更新时间戳
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      // 使用 Drizzle ORM 更新
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        await this.drizzleDB
          .update(table)
          .set(updateData as any)
          .where(eq(table.id as any, id))
          .run();
        return;
      }
      
      // 回退到原生 SQL 查询
      const entries = Object.entries(updateData).filter(([key]) => key !== 'id');
      const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
      const values = [...entries.map(([_, value]) => value), id];
      
      await this.executeRawQuery(
        `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
        values
      );
    } catch (error) {
      this.logger.error(`更新失败 (${tableName}/${id})`, error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `更新失败 (${tableName}/${id})`,
        error
      );
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    
    try {
      // 使用 Drizzle ORM 删除
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        await this.drizzleDB
          .delete(table)
          .where(eq(table.id as any, id))
          .run();
        return;
      }
      
      // 回退到原生 SQL 查询
      await this.executeRawQuery(
        `DELETE FROM ${tableName} WHERE id = ?`,
        [id]
      );
    } catch (error) {
      this.logger.error(`删除失败 (${tableName}/${id})`, error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `删除失败 (${tableName}/${id})`,
        error
      );
    }
  }

  async query<T extends BaseEntity>(
    tableName: string,
    options: QueryOptions
  ): Promise<QueryResult<T>> {
    this.checkInitialized();
    
    try {
      // 使用 Drizzle ORM 查询
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        let query = this.drizzleDB.select().from(table);
        let countQuery = this.drizzleDB.select({ count: sql`count(*)` }).from(table);
        
        // 应用过滤条件
        if (options.where) {
          const conditions = Object.entries(options.where)
            .map(([key, value]) => sql`${sql.raw(key)} = ${value}`)
            .reduce((prev, curr) => prev ? and(prev, curr) : curr, undefined);
          if (conditions) {
            query = query.where(conditions) as any;
            countQuery = countQuery.where(conditions) as any;
          }
        }
        
        // 应用排序
        if (options.orderBy) {
          const { field, direction } = options.orderBy;
          if (direction === 'asc') {
            // 使用类型断言解决Drizzle类型问题
            query = query.orderBy(table[field as keyof typeof table] as any) as any;
          } else {
            // 使用类型断言解决Drizzle类型问题
            query = query.orderBy(sql`${table[field as keyof typeof table]} DESC`) as any;
          }
        }
        
        // 执行计数查询
        const countResult = await countQuery.get();
        const total = Number(countResult?.count || 0);
        
        // 应用分页
        if (options.offset !== undefined) {
          // 使用类型断言解决Drizzle类型问题
          query = query.offset(options.offset) as any;
        }
        if (options.limit !== undefined) {
          // 使用类型断言解决Drizzle类型问题
          query = query.limit(options.limit) as any;
        }
        
        const results = await query.all();
        
        return {
          data: results.map(result => this.processResult<T>(result)),
          total,
          hasMore: options.limit ? total > (options.offset || 0) + options.limit : false
        };
      }
      
      // 回退到原生 SQL 查询
      let queryStr = `SELECT * FROM ${tableName}`;
      let countQueryStr = `SELECT COUNT(*) as count FROM ${tableName}`;
      const params: any[] = [];
      const countParams: any[] = [];
      
      // 应用过滤条件
      if (options.where) {
        const conditions = Object.entries(options.where)
          .map(([key, value]) => {
            params.push(value);
            return `${key} = ?`;
          })
          .join(' AND ');
        if (conditions) {
          queryStr += ` WHERE ${conditions}`;
          countQueryStr += ` WHERE ${conditions}`;
          params.push(...params);
          countParams.push(...params);
        }
      }
      
      // 应用排序
      if (options.orderBy) {
        const { field, direction } = options.orderBy;
        queryStr += ` ORDER BY ${field} ${direction.toUpperCase()}`;
      }
      
      // 获取总数
      const countResult = await this.executeRawQuery<{ count: number }>(countQueryStr, countParams);
      const total = countResult[0]?.count || 0;
      
      // 应用分页
      if (options.limit !== undefined) {
        queryStr += ` LIMIT ${options.limit}`;
        if (options.offset !== undefined) {
          queryStr += ` OFFSET ${options.offset}`;
        }
      }
      
      const results = await this.executeRawQuery<T>(queryStr, params);
      
      return {
        data: results.map(result => this.processResult<T>(result)),
        total,
        hasMore: options.limit ? total > (options.offset || 0) + options.limit : false
      };
    } catch (error) {
      this.logger.error(`查询失败 (${tableName})`, error);
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `查询失败 (${tableName})`,
        error
      );
    }
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.checkInitialized();
    
    if (!this.d1) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        'D1 数据库未初始化'
      );
    }
    
    try {
      // 使用原生 D1 查询
      const statement = this.d1.prepare(query);
      if (params && params.length > 0) {
        for (let i = 0; i < params.length; i++) {
          statement.bind(i + 1, params[i]);
        }
      }
      
      const result = await statement.all<R>();
      return result.results || [];
    } catch (error) {
      this.logger.error('执行原始查询失败:', error);
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        '执行原始查询失败',
        error
      );
    }
  }

  // 事务支持
  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    
    if (!this.d1) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        'D1 数据库未初始化'
      );
    }
    
    if (this.transactionActive) {
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_ERROR,
        '已有活动的事务'
      );
    }
    
    try {
      await this.executeRawQuery('BEGIN TRANSACTION');
      this.transactionActive = true;
      this.logger.debug('开始 D1 事务');
    } catch (error) {
      this.logger.error('D1 事务开始失败:', error);
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_ERROR,
        'D1 事务开始失败',
        error
      );
    }
  }

  async commitTransaction(): Promise<void> {
    this.checkInitialized();
    this.checkTransactionActive();
    
    try {
      await this.executeRawQuery('COMMIT');
      this.transactionActive = false;
      this.logger.debug('提交 D1 事务');
    } catch (error) {
      this.logger.error('D1 事务提交失败:', error);
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_COMMIT_ERROR,
        'D1 事务提交失败',
        error
      );
    }
  }

  async rollbackTransaction(): Promise<void> {
    this.checkInitialized();
    this.checkTransactionActive();
    
    try {
      await this.executeRawQuery('ROLLBACK');
      this.transactionActive = false;
      this.logger.debug('回滚 D1 事务');
    } catch (error) {
      this.logger.error('D1 事务回滚失败:', error);
      throw this.createError(
        DatabaseErrorCode.TRANSACTION_ROLLBACK_ERROR,
        'D1 事务回滚失败',
        error
      );
    }
  }

  async transaction<T>(callback: (tx: IDatabaseTransaction) => Promise<T>): Promise<T> {
    this.checkInitialized();
    
    if (!this.d1) {
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        'D1 数据库未初始化'
      );
    }

    const transactionWrapper: IDatabaseTransaction = {
      findById: async <U extends BaseEntity>(tableName: string, id: string) => this.findById<U>(tableName, id),
      findAll: async <U extends BaseEntity>(tableName: string, filter?: Record<string, any>) => this.findAll<U>(tableName, filter),
      create: async <U extends BaseEntity>(tableName: string, data: U) => this.create(tableName, data),
      update: async <U extends BaseEntity>(tableName: string, id: string, data: Partial<U>) => this.update(tableName, id, data),
      delete: async (tableName: string, id: string) => this.delete(tableName, id),
      query: async <U extends BaseEntity>(tableName: string, options: QueryOptions) => this.query<U>(tableName, options),
      batch: async <U extends BaseEntity>(tableName: string, operations: BatchOperation<U>[]) => this.batch(tableName, operations),
      executeRawQuery: async <U>(query: string, params?: any[]) => this.executeRawQuery<U>(query, params),
      count: async (tableName: string, filter?: Record<string, any>) => this.count(tableName, filter)
    };

    await this.beginTransaction();
    try {
      const result = await callback(transactionWrapper);
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  async batch<T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]): Promise<void> {
    this.checkInitialized();
    
    if (operations.length === 0) {
      return;
    }
    
    try {
      await this.beginTransaction();
      
      try {
        for (const operation of operations) {
          switch (operation.type) {
            case 'add':
              await this.create(tableName, operation.data);
              break;
            case 'put':
              await this.update(tableName, operation.data.id, operation.data);
              break;
            case 'delete':
              await this.delete(tableName, operation.data.id);
              break;
          }
        }
        
        await this.commitTransaction();
      } catch (error) {
        await this.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      this.logger.error(`批量操作失败 (${tableName})`, error);
      throw this.createError(
        DatabaseErrorCode.OPERATION_FAILED,
        `批量操作失败 (${tableName})`,
        error
      );
    }
  }

  // 计数方法
  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    this.checkInitialized();
    
    try {
      // 使用 Drizzle ORM 计数
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        let query = this.drizzleDB.select({ count: sql`count(*)` }).from(table);
        
        // 应用过滤条件
        if (filter && Object.keys(filter).length > 0) {
          const conditions = Object.entries(filter)
            .map(([key, value]) => sql`${sql.raw(key)} = ${value}`)
            .reduce((prev, curr) => prev ? and(prev, curr) : curr, undefined);
          if (conditions) {
            query = query.where(conditions) as any;
          }
        }
        
        const result = await query.get();
        return Number(result?.count || 0);
      }
      
      // 回退到原生 SQL 查询
      let queryStr = `SELECT COUNT(*) as count FROM ${tableName}`;
      const params: any[] = [];
      
      // 应用过滤条件
      if (filter && Object.keys(filter).length > 0) {
        const conditions = Object.entries(filter)
          .map(([key, value]) => {
            params.push(value);
            return `${key} = ?`;
          })
          .join(' AND ');
        
        if (conditions) {
          queryStr += ` WHERE ${conditions}`;
        }
      }
      
      const results = await this.executeRawQuery<{ count: number }>(queryStr, params);
      return Number(results[0]?.count || 0);
    } catch (error) {
      this.logger.error(`计数失败 (${tableName})`, error);
      throw this.createError(
        DatabaseErrorCode.QUERY_ERROR,
        `计数失败 (${tableName})`,
        error
      );
    }
  }

  // IDatabaseClient 接口实现
  async findUsers(query?: any): Promise<User[]> {
    return this.findAll<User>('users', query);
  }

  async findMatches(query?: any): Promise<Match[]> {
    return this.findAll<Match>('matches', query);
  }

  async findMessages(query?: any): Promise<Message[]> {
    return this.findAll<Message>('messages', query);
  }

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.create<User>('users', data as User);
  }

  async createMatch(data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
    return this.create<Match>('matches', data as Match);
  }

  async createMessage(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    return this.create<Message>('messages', data as Message);
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    await this.update<User>('users', id, data);
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    await this.update<Match>('matches', id, data);
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    await this.update<Message>('messages', id, data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.delete('users', id);
  }

  async deleteMatch(id: string): Promise<void> {
    await this.delete('matches', id);
  }

  async deleteMessage(id: string): Promise<void> {
    await this.delete('messages', id);
  }

  // 初始化 Drizzle ORM
  private initializeDrizzle(): void {
    if (!this.d1) return;
    
    try {
      // 初始化 Drizzle ORM
      // @ts-ignore - drizzle 接受 D1Database 类型但类型定义可能不匹配
      this.drizzleDB = drizzle(this.d1, { schema: drizzleSchema });
      this.logger.debug('Drizzle ORM 初始化成功');
    } catch (error) {
      this.logger.error('Drizzle ORM 初始化失败', error);
      // 初始化失败不应该阻止应用程序运行，只是回退到原生 D1
    }
  }
  
  // 处理数据库结果
  private processResult<T>(result: any): T {
    if (!result) return result;
    
    const processed = { ...result };
    
    // 处理日期字段
    this.processDateFields(processed);
    
    return processed as T;
  }
  
  // 处理日期字段
  private processDateFields(obj: Record<string, any>): void {
    for (const key in obj) {
      const value = obj[key];
      
      // 转换ISO日期字符串为Date对象
      if (
        typeof value === 'string' && 
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
      ) {
        try {
          obj[key] = new Date(value);
        } catch (e) {
          // 忽略转换错误
        }
      }
      // 递归处理嵌套对象
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.processDateFields(value);
      }
    }
  }
}