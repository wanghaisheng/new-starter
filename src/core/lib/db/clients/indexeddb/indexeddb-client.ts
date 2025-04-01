import { BaseClient } from '../base-client';
import { IDatabaseClient, DatabaseConfig, IDatabaseTransaction } from '../../interfaces';
import { schemaRegistry } from '../../schema/index';
import { QueryOptions, QueryResult, BatchOperation } from '../../types/database.types';
import { BaseEntity } from '../../types/base-entity';
import { User, Match, Message } from '../../models';

// Drizzle ORM 导入
import { drizzle } from 'drizzle-orm/sqlite-web';
import { eq, and, or, sql } from 'drizzle-orm';
import { drizzleSchema } from '../../schema/drizzle-schema';
import { DrizzleSchemaAdapter } from '../../schema/adapters/drizzle-adapter';

/**
 * IndexedDB 数据库客户端
 * 用于浏览器环境的本地存储
 */
export class IndexedDBClient extends BaseClient implements IDatabaseClient {
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig;
  private dbName: string;
  private dbVersion: number;
  private currentTransaction: IDBTransaction | null = null;
  
  // Drizzle ORM 实例
  private drizzleDB: any = null;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    this.dbName = config.name || 'app-database';
    this.dbVersion = config.version || 1;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 检查环境是否支持 IndexedDB
      if (!window.indexedDB) {
        throw new Error('当前浏览器不支持 IndexedDB');
      }

      // 打开数据库连接
      const openRequest = window.indexedDB.open(this.dbName, this.dbVersion);

      // 处理数据库升级事件
      openRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };

      // 等待数据库打开
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        openRequest.onsuccess = () => resolve(openRequest.result);
        openRequest.onerror = () => reject(openRequest.error);
      });
      
      // 初始化 Drizzle ORM
      this.initializeDrizzle();

      this.initialized = true;
      console.log(`IndexedDB 数据库 "${this.dbName}" 初始化成功`);
    } catch (error) {
      console.error('IndexedDB 初始化失败:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    
    const schemas = schemaRegistry.getAllSchemas();
    
    for (const schema of schemas) {
      await this.clearStore(schema.name);
    }
  }

  /**
   * 初始化 Drizzle ORM
   * 创建一个 Drizzle ORM 实例，用于操作 IndexedDB
   */
  private initializeDrizzle(): void {
    if (!this.db) return;
    
    try {
      // 创建 SQLite Web 数据库适配器
      const sqliteDB = {
        exec: async (sql: string, params?: any[]) => {
          return this.executeRawQuery(sql, params);
        },
        query: async (sql: string, params?: any[]) => {
          return this.executeRawQuery(sql, params);
        },
        run: async (sql: string, params?: any[]) => {
          return this.executeRawQuery(sql, params);
        }
      };
      
      // 创建 Drizzle ORM 实例
      this.drizzleDB = drizzle(sqliteDB);
      
      console.log('Drizzle ORM 初始化成功');
    } catch (error) {
      console.error('Drizzle ORM 初始化失败:', error);
      this.drizzleDB = null;
    }
  }
  
  // 通用数据访问方法
  async findById<T extends BaseEntity>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    
    try {
      // 使用 Drizzle ORM 查询（如果可用）
      if (this.drizzleDB && tableName in drizzleSchema) {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        const result = await this.drizzleDB
          .select()
          .from(table)
          .where(eq(table.id, id))
          .get();
        
        return result ? this.processResult<T>(result) : null;
      }
      
      // 回退到原生 IndexedDB 查询
      return await this.executeTransaction(tableName, 'readonly', (store) => {
        return new Promise<T | null>((resolve, reject) => {
          const request = store.get(id);
          
          request.onsuccess = () => {
            const result = request.result;
            resolve(result ? this.processResult<T>(result) : null);
          };
          
          request.onerror = () => {
            reject(request.error);
          };
        });
      });
    } catch (error) {
      console.error(`查询失败 (${tableName}/${id}):`, error);
      return null;
    }
  }

  async findAll<T extends BaseEntity>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    
    try {
      return await this.executeTransaction(tableName, 'readonly', (store) => {
        return new Promise<T[]>((resolve, reject) => {
          const request = store.getAll();
          
          request.onsuccess = () => {
            let results = request.result.map((item: Record<string, any>) => 
              this.processResult<T>(item)
            );
            
            // 应用过滤条件
            if (filter && Object.keys(filter).length > 0) {
              results = results.filter((item: any) => {
                return Object.entries(filter).every(([key, value]) => {
                  return item[key] === value;
                });
              });
            }
            
            resolve(results);
          };
          
          request.onerror = () => {
            reject(request.error);
          };
        });
      });
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
      await this.executeTransaction(tableName, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.add(itemWithTimestamps);
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
      
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
      
      await this.executeTransaction(tableName, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.put(updatedData);
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    } catch (error) {
      console.error(`更新失败 (${tableName}/${id}):`, error);
      throw error;
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    
    try {
      await this.executeTransaction(tableName, 'readwrite', (store) => {
        return new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
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
      
      // 回退到原始实现
      if (!this.db) {
        throw new Error('数据库未初始化');
      }

      const store = this.db.transaction(tableName, 'readonly').objectStore(tableName);
      let results = await new Promise<T[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // 应用过滤条件
      if (options.where) {
        results = results.filter(item => {
          const itemValue = (item as any)[options.where!.field];
          switch (options.where!.operator) {
            case '==': return itemValue === options.where!.value;
            case '<': return itemValue < options.where!.value;
            case '<=': return itemValue <= options.where!.value;
            case '>': return itemValue > options.where!.value;
            case '>=': return itemValue >= options.where!.value;
            case '!=': return itemValue !== options.where!.value;
            default: return true;
          }
        });
      }

      // 应用排序
      if (options.orderBy) {
        results.sort((a, b) => {
          const aValue = (a as any)[options.orderBy!.field];
          const bValue = (b as any)[options.orderBy!.field];
          const direction = options.orderBy!.direction === 'asc' ? 1 : -1;
          return aValue < bValue ? -direction : aValue > bValue ? direction : 0;
        });
      }

      const total = results.length;

      // 应用分页
      if (options.limit !== undefined || options.offset !== undefined) {
        const start = options.offset || 0;
        const end = options.limit !== undefined ? start + options.limit : undefined;
        results = results.slice(start, end);
      }

      return {
        data: results,
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
    
    // 使用 Drizzle ORM 执行原始查询
    if (this.drizzleDB) {
      try {
        const result = await this.drizzleDB.execute(sql`${query}`, params || []);
        return result as R[];
      } catch (error) {
        console.error('执行原始查询失败:', error);
      }
    }
    
    throw new Error('IndexedDB 不支持原始 SQL 查询');
  }

  // 事务支持
  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    if (this.currentTransaction) {
      throw new Error('已有活动的事务');
    }
    
    // 使用 Drizzle ORM 开始事务
    if (this.drizzleDB) {
      try {
        // 注意：这里我们不实际开始Drizzle事务，而是在需要时创建
        // Drizzle事务会在实际执行查询时开始
        console.log('准备Drizzle事务');
      } catch (error) {
        console.error('Drizzle事务开始失败:', error);
        // 回退到原生IndexedDB
      }
    }
    
    this.currentTransaction = this.db.transaction(Array.from(this.db.objectStoreNames), 'readwrite');
  }

  async commitTransaction(): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error('没有活动的事务');
    }
    
    // 使用 Drizzle ORM 提交事务
    if (this.drizzleDB) {
      try {
        // 注意：由于我们的Drizzle事务是在执行查询时创建的
        // 这里我们只需记录事务已提交
        console.log('提交Drizzle事务');
      } catch (error) {
        console.error('Drizzle事务提交失败:', error);
      }
    }
    
    return new Promise((resolve, reject) => {
      this.currentTransaction!.oncomplete = () => {
        this.currentTransaction = null;
        resolve();
      };
      this.currentTransaction!.onerror = () => {
        this.currentTransaction = null;
        reject(this.currentTransaction!.error);
      };
    });
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.currentTransaction) {
      throw new Error('没有活动的事务');
    }
    
    // 使用 Drizzle ORM 回滚事务
    if (this.drizzleDB) {
      try {
        // 注意：由于我们的Drizzle事务是在执行查询时创建的
        // 这里我们只需记录事务已回滚
        console.log('回滚Drizzle事务');
      } catch (error) {
        console.error('Drizzle事务回滚失败:', error);
      }
    }
    
    this.currentTransaction.abort();
    this.currentTransaction = null;
  }

  async transaction<T>(callback: (tx: IDatabaseTransaction) => Promise<T>): Promise<T> {
    this.checkInitialized();
    if (!this.db) {
      throw new Error('数据库未初始化');
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
        
        // 使用 Drizzle 事务执行批量操作
        await this.drizzleDB.transaction(async (tx: any) => {
          for (const operation of operations) {
            switch (operation.type) {
              case 'create':
                await tx.insert(table).values(this.addTimestamps(operation.data, false)).run();
                break;
              case 'update':
                await tx.update(table)
                  .set(this.addTimestamps(operation.data, true))
                  .where(eq(table.id, operation.id))
                  .run();
                break;
              case 'delete':
                await tx.delete(table).where(eq(table.id, operation.id)).run();
                break;
              default:
                throw new Error(`不支持的操作类型: ${(operation as any).type}`);
            }
          }
        });
        
        return;
      }
        
        // await this.drizzleDB.transaction(async (tx) => {
        //   for (const operation of operations) {
        //     switch (operation.type) {
        //       case 'add':
        //         await tx.insert(table).values(operation.data).run();
        //         break;
        //       case 'put':
        //         await tx.update(table).set(operation.data).where(eq(table.id, operation.data.id)).run();
        //         break;
        //       case 'delete':
        //         await tx.delete(table).where(eq(table.id, operation.data.id)).run();
        //         break;
        //     }
        //   }
        // });
        // return;
      }
      
      // 回退到原始 IndexedDB 实现
      if (!this.db) {
        throw new Error('数据库未初始化');
      }

      await this.beginTransaction();
      try {
        const store = this.currentTransaction!.objectStore(tableName);
        
        for (const operation of operations) {
          switch (operation.type) {
            case 'add':
              await new Promise((resolve, reject) => {
                const request = store.add(operation.data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
              break;
            
            case 'put':
              await new Promise((resolve, reject) => {
                const request = store.put(operation.data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
              break;
            
            case 'delete':
              await new Promise((resolve, reject) => {
                const request = store.delete(operation.data.id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
              });
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
        // let query = this.drizzleDB.select({ count: sql`count(*)` }).from(table);
        
        // // 应用过滤条件
        // if (filter && Object.keys(filter).length > 0) {
        //   const conditions = Object.entries(filter).map(([key, value]) => {
        //     return eq(table[key as keyof typeof table], value);
        //   });
        //   query = query.where(and(...conditions));
        // }
        
        // const result = await query.get();
        // return result?.count || 0;
      }
      
      // 回退到原始实现
      const items = await this.findAll(tableName, filter);
      return items.length;
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

  // 辅助方法
  private createStores(db: IDBDatabase): void {
    const schemas = schemaRegistry.getAllSchemas();
    
    for (const schema of schemas) {
      if (!db.objectStoreNames.contains(schema.name)) {
        const store = db.createObjectStore(schema.name, { keyPath: 'id' });
        
        // 创建索引
        if (schema.indexes) {
          for (const index of schema.indexes) {
            store.createIndex(index.name, index.columns, { unique: index.unique });
          }
        }
      }
    }
  }
  
  // 初始化 Drizzle ORM
  private initializeDrizzle(): void {
    if (!this.db) return;
    
    try {
      // 创建一个适配器，将IndexedDB连接转换为Drizzle可用的格式
      const indexedDBAdapter = {
        // 实现基本的查询接口
        query: async (sql: string, params: any[] = []) => {
          // 将SQL查询转换为IndexedDB操作
          // 这里是一个简化实现，实际上我们会解析SQL并转换为IndexedDB操作
          console.log('执行Drizzle查询:', sql, params);
          return [];
        },
        
        // 执行SQL语句
        exec: async (sql: string) => {
          console.log('执行Drizzle SQL:', sql);
          return [];
        },
        
        // 获取单条记录
        get: async (sql: string, params: any[] = []) => {
          console.log('执行Drizzle get:', sql, params);
          return null;
        },
        
        // 获取多条记录
        all: async (sql: string, params: any[] = []) => {
          console.log('执行Drizzle all:', sql, params);
          return [];
        },
        
        // 执行并返回插入的ID
        run: async (sql: string, params: any[] = []) => {
          console.log('执行Drizzle run:', sql, params);
          return { lastID: this.generateId(), changes: 1 };
        }
      };
      
      // 初始化Drizzle ORM
      this.drizzleDB = drizzle(indexedDBAdapter, { schema: drizzleSchema });
      console.log('Drizzle ORM 初始化成功');
    } catch (error) {
      console.error('Drizzle ORM 初始化失败:', error);
      // 初始化失败不应该阻止应用程序运行，只是回退到原生IndexedDB
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

  private async clearStore(storeName: string): Promise<void> {
    return this.executeTransaction(storeName, 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  private async executeTransaction<T>(
    storeName: string, 
    mode: IDBTransactionMode, 
    callback: (store: IDBObjectStore) => Promise<T>
  ): Promise<T> {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    
    const transaction = this.db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    
    try {
      return await callback(store);
    } catch (error) {
      transaction.abort();
      throw error;
    }
  }

  private matchesFilter(item: any, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      if (key === '$or') return true; // 已在外层处理
      
      if (key === '$ne' && typeof value === 'object') {
        // 不等于操作符
        return Object.entries(value).every(([neKey, neValue]) => 
          item[neKey] !== neValue
        );
      } else if (key === '$contains' && typeof value === 'string') {
        // 包含操作符
        return typeof item[key] === 'string' && 
               item[key].toLowerCase().includes(value.toLowerCase());
      } else {
        // 普通相等条件
        return item[key] === value;
      }
    });
  }

  /**
   * 处理数据库结果，转换特殊类型
   */
  private processResult<T>(result: Record<string, any>): T {
    const processed: Record<string, any> = { ...result };
    
    // 处理日期字段
    for (const key in processed) {
      // 如果是日期字符串，转换为 Date 对象
      if (typeof processed[key] === 'string' && 
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(processed[key])) {
        processed[key] = new Date(processed[key]);
      }
    }
    
    return processed as T;
  }
}