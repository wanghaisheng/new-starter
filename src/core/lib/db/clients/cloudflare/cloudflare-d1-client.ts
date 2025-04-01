import { BaseClient } from '../base-client';
import { IDatabaseClient, DatabaseConfig, IDatabaseTransaction } from '../../interfaces';
import { schemaRegistry } from '../../schema/index';
import { QueryOptions, QueryResult, BatchOperation } from '../../types/database.types';
import { BaseEntity } from '../../types/base-entity';
import { User, Match, Message } from '../../models';

// Drizzle ORM 导入
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import { eq, and, or, sql } from 'drizzle-orm';
import { drizzleSchema } from '../../schema/drizzle-schema';
import { DrizzleSchemaAdapter } from '../../schema/adapters/drizzle-adapter';

/**
 * Cloudflare D1 数据库客户端
 * 用于 Cloudflare Workers 环境的 D1 数据库
 */
export class CloudflareD1Client extends BaseClient implements IDatabaseClient {
  private d1: D1Database | null = null;
  private config: DatabaseConfig;
  private dbName: string;
  private dbVersion: number;
  private currentTransaction: any = null;
  
  // Drizzle ORM 实例
  private drizzleDB: DrizzleD1Database<any> | null = null;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    this.dbName = config.name || 'app-database';
    this.dbVersion = config.version || 1;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 检查是否在 Cloudflare Workers 环境中
      if (typeof globalThis.D1Database === 'undefined') {
        throw new Error('当前环境不支持 Cloudflare D1 数据库');
      }

      // 获取 D1 数据库实例
      this.d1 = this.config.d1Instance as unknown as D1Database;
      if (!this.d1) {
        throw new Error('未提供 D1 数据库实例');
      }

      // 初始化 Drizzle ORM
      this.initializeDrizzle();

      this.initialized = true;
      console.log(`Cloudflare D1 数据库 "${this.dbName}" 初始化成功`);
    } catch (error) {
      console.error('Cloudflare D1 初始化失败:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // D1 不需要显式关闭连接
    this.d1 = null;
    this.drizzleDB = null;
    this.initialized = false;
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    
    const schemas = schemaRegistry.getAllSchemas();
    
    for (const schema of schemas) {
      await this.executeRawQuery(`DELETE FROM ${schema.name}`);
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
          .where(eq(table.id, id))
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
      console.error(`查询失败 (${tableName}/${id}):`, error);
      return null;
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
          const conditions = Object.entries(filter).map(([key, value]) => {
            return eq(table[key as keyof typeof table], value);
          });
          query = query.where(and(...conditions));
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
          .map(([key, value], index) => {
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
      console.error(`查询失败 (${tableName}):`, error);
      return [];
    }
  }

  async create<T extends BaseEntity>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    
    // 确保有 ID
    if (!data.id) {
      data.id = this.generateId();
    }
    
    // 添加时间戳
    const itemWithTimestamps = this.addTimestamps(data, false);
    
    try {
      // 使用 Drizzle ORM 插入
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        await this.drizzleDB.insert(table).values(itemWithTimestamps).run();
        return itemWithTimestamps;
      }
      
      // 回退到原生 SQL 查询
      const keys = Object.keys(itemWithTimestamps);
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(key => (itemWithTimestamps as any)[key]);
      
      await this.executeRawQuery(
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
      
      return itemWithTimestamps;
    } catch (error) {
      console.error(`创建失败 (${tableName}):`, error);
      throw error;
    }
  }

  async update<T extends BaseEntity>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    
    try {
      // 先获取现有数据
      const existing = await this.findById<T>(tableName, id);
      if (!existing) {
        throw new Error(`更新失败: 找不到 ID 为 ${id} 的记录`);
      }
      
      // 合并数据并添加更新时间戳
      const updatedData = this.addTimestamps({ ...existing, ...data }, true);
      
      // 使用 Drizzle ORM 更新
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        await this.drizzleDB
          .update(table)
          .set(updatedData)
          .where(eq(table.id, id))
          .run();
        return;
      }
      
      // 回退到原生 SQL 查询
      const entries = Object.entries(updatedData).filter(([key]) => key !== 'id');
      const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
      const values = [...entries.map(([_, value]) => value), id];
      
      await this.executeRawQuery(
        `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
        values
      );
    } catch (error) {
      console.error(`更新失败 (${tableName}/${id}):`, error);
      throw error;
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
          .where(eq(table.id, id))
          .run();
        return;
      }
      
      // 回退到原生 SQL 查询
      await this.executeRawQuery(
        `DELETE FROM ${tableName} WHERE id = ?`,
        [id]
      );
    } catch (error) {
      console.error(`删除失败 (${tableName}/${id}):`, error);
      throw error;
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
        
        // 应用过滤条件
        if (options.where) {
          const whereCondition = this.buildDrizzleWhereCondition(table, options.where);
          query = query.where(whereCondition);
        }
        
        // 应用排序
        if (options.orderBy) {
          const { field, direction } = options.orderBy;
          query = direction === 'asc' 
            ? query.orderBy(table[field as keyof typeof table].asc())
            : query.orderBy(table[field as keyof typeof table].desc());
        }
        
        // 获取总数
        const countQuery = this.drizzleDB.select({ count: sql`count(*)` }).from(table);
        if (options.where) {
          const whereCondition = this.buildDrizzleWhereCondition(table, options.where);
          countQuery.where(whereCondition);
        }
        const countResult = await countQuery.get();
        const total = countResult?.count || 0;
        
        // 应用分页
        if (options.offset !== undefined) {
          query = query.offset(options.offset);
        }
        if (options.limit !== undefined) {
          query = query.limit(options.limit);
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
      const countQueryStr = `SELECT COUNT(*) as count FROM ${tableName}`;
      const params: any[] = [];
      const countParams: any[] = [];
      
      // 应用过滤条件
      if (options.where) {
        const { whereClause, whereParams } = this.buildSqlWhereClause(options.where);
        if (whereClause) {
          queryStr += ` WHERE ${whereClause}`;
          countQueryStr += ` WHERE ${whereClause}`;
          params.push(...whereParams);
          countParams.push(...whereParams);
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
      console.error(`查询失败 (${tableName}):`, error);
      throw error;
    }
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.checkInitialized();
    
    if (!this.d1) {
      throw new Error('D1 数据库未初始化');
    }
    
    try {
      // 使用 Drizzle ORM 执行原始查询
      if (this.drizzleDB) {
        const result = await this.drizzleDB.execute(sql`${query}`, params || []);
        return result.results as R[];
      }
      
      // 回退到原生 D1 查询
      const statement = this.d1.prepare(query);
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          statement.bind(index + 1, param);
        });
      }
      
      const result = await statement.all();
      return result.results as R[];
    } catch (error) {
      console.error('执行原始查询失败:', error);
      throw error;
    }
  }

  // 事务支持
  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    if (!this.d1) {
      throw new Error('D1 数据库未初始化');
    }
    if (this.currentTransaction) {
      throw new Error('已有活动的事务');
    }
    
    // 使用 Drizzle ORM 开始事务
    if (this.drizzleDB) {
      try {
        await this.executeRawQuery('BEGIN TRANSACTION');
        console.log('开始 D1 事务');
      } catch (error) {
        console.error('D1 事务开始失败:', error);
        throw error;
      }
    }
  }

  async commitTransaction(): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error('没有活动的事务');
    }
    
    // 使用 Drizzle ORM 提交事务
    if (this.drizzleDB) {
      try {
        await this.executeRawQuery('COMMIT');
        console.log('提交 D1 事务');
        this.currentTransaction = null;
      } catch (error) {
        console.error('D1 事务提交失败:', error);
        throw error;
      }
    }
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error('没有活动的事务');
    }
    
    // 使用 Drizzle ORM 回滚事务
    if (this.drizzleDB) {
      try {
        await this.executeRawQuery('ROLLBACK');
        console.log('回滚 D1 事务');
        this.currentTransaction = null;
      } catch (error) {
        console.error('D1 事务回滚失败:', error);
        throw error;
      }
    }
  }

  async transaction<T>(callback: (tx: IDatabaseTransaction) => Promise<T>): Promise<T> {
    this.checkInitialized();
    if (!this.d1) {
      throw new Error('D1 数据库未初始化');
    }

    const transactionWrapper: IDatabaseTransaction = {
      findById: async <T extends BaseEntity>(tableName: string, id: string) => this.findById<T>(tableName, id),
      findAll: async <T extends BaseEntity>(tableName: string, filter?: Record<string, any>) => this.findAll<T>(tableName, filter),
      create: async <T extends BaseEntity>(tableName: string, data: T) => this.create(tableName, data),
      update: async <T extends BaseEntity>(tableName: string, id: string, data: Partial<T>) => this.update(tableName, id, data),
      delete: async (tableName: string, id: string) => this.delete(tableName, id),
      query: async <T extends BaseEntity>(tableName: string, options: QueryOptions) => this.query<T>(tableName, options),
      batch: async <T extends BaseEntity>(tableName: string, operations: BatchOperation<T>[]) => this.batch(tableName, operations),
      executeRawQuery: async <T>(query: string, params?: any[]) => this.executeRawQuery<T>(query, params),
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
    
    try {
      // 使用 Drizzle ORM 批量操作
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        
        await this.beginTransaction();
        try {
          for (const operation of operations) {
            switch (operation.type) {
              case 'add':
                await this.drizzleDB.insert(table).values(operation.data).run();
                break;
              case 'put':
                await this.drizzleDB
                  .update(table)
                  .set(operation.data)
                  .where(eq(table.id, operation.data.id))
                  .run();
                break;
              case 'delete':
                await this.drizzleDB
                  .delete(table)
                  .where(eq(table.id, operation.data.id))
                  .run();
                break;
            }
          }
          await this.commitTransaction();
        } catch (error) {
          await this.rollbackTransaction();
          throw error;
        }
        return;
      }
      
      // 回退到原生 SQL 批量操作
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
      console.error(`批量操作失败 (${tableName}):`, error);
      throw error;
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
          const conditions = Object.entries(filter).map(([key, value]) => {
            return eq(table[key as keyof typeof table], value);
          });
          query = query.where(and(...conditions));
        }
        
        const result = await query.get();
        return result?.count || 0;
      }
      
      // 回退到原生 SQL 查询
      let queryStr = `SELECT COUNT(*) as count FROM ${tableName}`;
      const params: any[] = [];
      
      // 应用过滤条件
      if (filter && Object.keys(filter).length > 0) {
        const conditions = Object.entries(filter)
          .map(([key, value], index) => {
            params.push(value);
            return `${key} = ?`;
          })
          .join(' AND ');
        
        if (conditions) {
          queryStr += ` WHERE ${conditions}`;
        }
      }
      
      const results = await this.executeRawQuery<{ count: number }>(queryStr, params);
      return results[0]?.count || 0;
    } catch (error) {
      console.error(`计数失败 (${tableName}):`, error);
      return 0;
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

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    return this.create<User>('users', data as User);
  }

  async createMatch(data: Omit<Match, 'id'>): Promise<Match> {
    return this.create<Match>('matches', data as Match);
  }

  async createMessage(data: Omit<Message, 'id'>): Promise<Message> {
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
      this.drizzleDB = drizzle(this.d1, { schema: drizzleSchema });
      console.log('Drizzle ORM 初始化成功');
    } catch (error) {
      console.error('Drizzle ORM 初始化失败:', error);
      // 初始化失败不应该阻止应用程序运行，只是回退到原生 D1
    }
  }
  
  // 构建 Drizzle 查询条件
  private buildDrizzleWhereCondition(table: any, whereOption: QueryOptions['where']): any {
    if (!whereOption) return undefined;
    
    if ('$and' in whereOption && whereOption.$and) {
      const conditions = whereOption.$and.map(condition => 
        this.buildDrizzleWhereCondition(table, condition)
      );
      return and(...conditions);
    }
    
    if ('$or' in whereOption && whereOption.$or) {
      const conditions = whereOption.$or.map(condition => 
        this.buildDrizzleWhereCondition(table, condition)
      );
      return or(...conditions);
    }
    
    if ('field' in whereOption && 'operator' in whereOption && 'value' in whereOption) {
      const { field, operator, value } = whereOption;
      const column = table[field as keyof typeof table];
      
      switch (operator) {
        case '==':
          return eq(column, value);
        case '!=':
          return sql`${column} != ${value}`;
        case '<':
          return sql`${column} < ${value}`;
        case '<=':
          return sql`${column} <= ${value}`;
        case '>':
          return sql`${column} > ${value}`;
        case '>=':
          return sql`${column} >= ${value}`;
        case '$in':
          return sql`${column} IN (${value.join(', ')})`;
        case '$contains':
          return sql`${column} LIKE '%${value}%'`;
        default:
          return eq(column, value);
      }
    }
    
    // 处理对象形式的条件
    const conditions = Object.entries(whereOption)
      .filter(([key]) => !key.startsWith('$'))
      .map(([key, value]) => eq(table[key as keyof typeof table], value));
    
    return conditions.length > 1 ? and(...conditions) : conditions[0];
  }

  // 构建 SQL WHERE 子句
  private buildSqlWhereClause(whereOption: QueryOptions['where']): { whereClause: string; whereParams: any[] } {
    const params: any[] = [];
    
    if (!whereOption) {
      return { whereClause: '', whereParams: [] };
    }
    
    if ('$and' in whereOption && whereOption.$and) {
      const conditions = whereOption.$and.map(condition => {
        const { whereClause, whereParams } = this.buildSqlWhereClause(condition);
        params.push(...whereParams);
        return `(${whereClause})`;
      });
      return { 
        whereClause: conditions.join(' AND '), 
        whereParams: params 
      };
    }
    
    if ('$or' in whereOption && whereOption.$or) {
      const conditions = whereOption.$or.map(condition => {
        const { whereClause, whereParams } = this.buildSqlWhereClause(condition);
        params.push(...whereParams);
        return `(${whereClause})`;
      });
      return { 
        whereClause: conditions.join(' OR '), 
        whereParams: params 
      };
    }
    
    if ('field' in whereOption && 'operator' in whereOption && 'value' in whereOption) {
      const { field, operator, value } = whereOption;
      params.push(value);
      
      switch (operator) {
        case '==':
          return { whereClause: `${field} = ?`, whereParams: params };
        case '!=':
          return { whereClause: `${field} != ?`, whereParams: params };
        case '