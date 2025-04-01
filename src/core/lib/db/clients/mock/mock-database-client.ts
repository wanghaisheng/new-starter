import { BaseClient } from '../base-client';
import { IDatabaseClient, IDatabaseTransaction, IBaseDatabaseClient } from '../../interfaces';
import { User, Match, Message } from '../../models';
import { BaseEntity } from '../../types/base-entity';
import { QueryOptions, QueryResult, BatchOperation } from '../../types/database.types';
import { schemaRegistry } from '../../schema/index';
import { DrizzleSchemaAdapter } from '../../schema/adapters/drizzle-adapter';
import { drizzleSchema } from '../../schema/drizzle-schema';
import { eq, and, or, like } from 'drizzle-orm';

export class MockDatabaseClient extends BaseClient implements IDatabaseClient {
  private users: Map<string, User> = new Map();
  private matches: Map<string, Match> = new Map();
  private messages: Map<string, Message> = new Map();
  private tables: Map<string, Map<string, BaseEntity>> = new Map();
  private inTransaction = false;
  
  // Drizzle ORM 模拟实例
  private drizzleDB: any = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // 初始化表结构
      this.tables.set('users', this.users);
      this.tables.set('matches', this.matches);
      this.tables.set('messages', this.messages);
      
      // 加载模拟数据
      const mockUsers: User[] = [
        {
          id: '1',
          name: '张三',
          age: 25,
          bio: '喜欢运动和音乐',
          images: ['https://picsum.photos/400/600?random=1'],
          interests: ['运动', '音乐', '旅行'],
          location: { latitude: 39.9042, longitude: 116.4074 },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: '李四',
          age: 28,
          bio: '热爱美食和摄影',
          images: ['https://picsum.photos/400/600?random=2'],
          interests: ['美食', '摄影', '电影'],
          location: { latitude: 39.9042, longitude: 116.4074 },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockUsers.forEach(user => this.users.set(user.id, user));
      
      // 初始化 Drizzle ORM
      this.initializeDrizzle();
      
      this.initialized = true;
      console.log('MockDatabaseClient 初始化成功');
    } catch (error) {
      console.error('MockDatabaseClient 初始化失败:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    this.users.clear();
    this.matches.clear();
    this.messages.clear();
  }
  
  /**
   * 初始化 Drizzle ORM
   * 创建一个模拟的 Drizzle ORM 实例
   */
  private initializeDrizzle(): void {
    // 创建一个模拟的 Drizzle ORM 实例
    // 这里我们只是模拟 Drizzle ORM 的接口，不实际使用 Drizzle ORM
    this.drizzleDB = {
      select: () => ({
        from: (table: any) => ({
          where: () => ({
            get: async () => null,
            all: async () => []
          }),
          orderBy: () => ({
            get: async () => null,
            all: async () => []
          }),
          limit: () => ({
            offset: () => ({
              get: async () => null,
              all: async () => []
            }),
            get: async () => null,
            all: async () => []
          }),
          get: async () => null,
          all: async () => []
        })
      }),
      insert: () => ({
        values: () => ({
          run: async () => ({})
        })
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            run: async () => ({})
          })
        })
      }),
      delete: () => ({
        where: () => ({
          run: async () => ({})
        })
      }),
      transaction: async (callback: Function) => {
        await this.beginTransaction();
        try {
          const result = await callback(this.drizzleDB);
          await this.commitTransaction();
          return result;
        } catch (error) {
          await this.rollbackTransaction();
          throw error;
        }
      }
    };
  }

  async close(): Promise<void> {
    // Mock实现不需要关闭操作
  }

  // IBaseDatabaseClient 接口实现
  async findById(tableName: string, id: string): Promise<BaseEntity | null> {
    this.checkInitialized();
    const table = this.tables.get(tableName);
    if (!table) return null;
    return table.get(id) || null;
  }

  async findAll(tableName: string, filter?: Record<string, any>): Promise<BaseEntity[]> {
    this.checkInitialized();
    const table = this.tables.get(tableName);
    if (!table) return [];
    
    const entities = Array.from(table.values());
    if (!filter) return entities;
    
    return entities.filter(entity => {
      return Object.entries(filter).every(([key, value]) => {
        return entity[key as keyof BaseEntity] === value;
      });
    });
  }

  async create(tableName: string, data: BaseEntity): Promise<BaseEntity> {
    this.checkInitialized();
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table not found: ${tableName}`);
    }
    
    const id = data.id || this.generateId();
    const entity = {
      ...data,
      id,
      ...this.addTimestamps(data)
    } as BaseEntity;
    
    table.set(id, entity);
    return entity;
  }

  async update(tableName: string, id: string, data: Partial<BaseEntity>): Promise<void> {
    this.checkInitialized();
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table not found: ${tableName}`);
    }
    
    const existingEntity = table.get(id);
    if (!existingEntity) {
      throw new Error(`Entity not found: ${id} in table ${tableName}`);
    }
    
    const updatedEntity = {
      ...existingEntity,
      ...data,
      updatedAt: new Date()
    };
    
    table.set(id, updatedEntity);
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    const table = this.tables.get(tableName);
    if (!table) return;
    table.delete(id);
  }

  async query<T extends BaseEntity = BaseEntity>(tableName: string, options: QueryOptions): Promise<QueryResult<T>> {
    this.checkInitialized();
    const table = this.tables.get(tableName);
    if (!table) {
      return { data: [], total: 0 };
    }
    
    let entities = Array.from(table.values()) as T[];
    
    // 使用 Drizzle ORM 查询（如果可用）
    if (this.drizzleDB && tableName in drizzleSchema) {
      try {
        const table = drizzleSchema[tableName as keyof typeof drizzleSchema];
        let query = this.drizzleDB.select().from(table);
        
        // 应用过滤条件
        if (options.where) {
          const whereCondition = this.buildDrizzleWhereCondition(table, options.where);
          query = query.where(whereCondition);
        }
        
        // 应用排序
        if (options.orderBy) {
          query = query.orderBy(table[options.orderBy.field]);
        }
        
        // 应用分页
        if (options.limit !== undefined) {
          query = query.limit(options.limit);
          if (options.offset !== undefined) {
            query = query.offset(options.offset);
          }
        }
        
        const results = await query.all();
        return { 
          data: results.map(r => this.processResult<T>(r)), 
          total: await this.count(tableName, options.where ? this.convertWhereToFilter(options.where) : undefined) 
        };
      } catch (error) {
        console.error('Drizzle 查询失败，回退到内存查询:', error);
        // 回退到内存查询
      }
    }
    
    // 内存查询实现
    // 应用过滤条件
    if (options.where) {
      entities = this.applyFilter(entities, options.where);
    }
    
    // 应用排序
    if (options.orderBy) {
      entities = this.applySort(entities, options.orderBy);
    }
    
    const total = entities.length;
    
    // 应用分页
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || entities.length;
      entities = entities.slice(offset, offset + limit);
    }
    
    return { data: entities, total };
  }

  async count(tableName: string, filter?: Record<string, any>): Promise<number> {
    const entities = await this.findAll(tableName, filter);
    return entities.length;
  }

  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    if (this.inTransaction) {
      throw new Error('Transaction already in progress');
    }
    this.inTransaction = true;
  }

  async commitTransaction(): Promise<void> {
    this.checkInitialized();
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }
    this.inTransaction = false;
  }

  async rollbackTransaction(): Promise<void> {
    this.checkInitialized();
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }
    this.inTransaction = false;
  }
  
  /**
   * 批量操作
   * @param tableName 表名
   * @param operations 批量操作列表
   */
  async batch(tableName: string, operations: BatchOperation<BaseEntity>[]): Promise<void> {
    this.checkInitialized();
    const table = this.tables.get(tableName);
    if (!table) {
      throw new Error(`Table not found: ${tableName}`);
    }
    
    // 开始事务
    await this.beginTransaction();
    
    try {
      for (const operation of operations) {
        switch (operation.type) {
          case 'create':
            await this.create(tableName, operation.data);
            break;
          case 'update':
            await this.update(tableName, operation.id, operation.data);
            break;
          case 'delete':
            await this.delete(tableName, operation.id);
            break;
          default:
            throw new Error(`不支持的操作类型: ${(operation as any).type}`);
        }
      }
      
      // 提交事务
      await this.commitTransaction();
    } catch (error) {
      // 回滚事务
      await this.rollbackTransaction();
      throw error;
    }
  }
  
  /**
   * 执行原始查询
   * 注意：这是一个模拟实现，实际上不执行任何SQL查询
   */
  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.checkInitialized();
    console.log(`Mock执行查询: ${query}`, params);
    // 模拟实现，返回空数组
    return [];
  }

  // 辅助方法
  
  /**
   * 构建 Drizzle ORM 的 where 条件
   * @param table Drizzle 表对象
   * @param whereOption 查询条件
   * @returns Drizzle where 条件
   */
  private buildDrizzleWhereCondition(table: any, whereOption: QueryOptions['where']): any {
    if (!whereOption) return undefined;
    
    // 处理复杂条件
    if ('$and' in whereOption && whereOption.$and) {
      return and(...whereOption.$and.map(condition => this.buildDrizzleWhereCondition(table, condition)));
    }
    
    if ('$or' in whereOption && whereOption.$or) {
      return or(...whereOption.$or.map(condition => this.buildDrizzleWhereCondition(table, condition)));
    }
    
    // 处理简单条件
    if ('field' in whereOption && 'operator' in whereOption && 'value' in whereOption) {
      const { field, operator, value } = whereOption;
      const column = table[field];
      
      switch (operator) {
        case '==':
          return eq(column, value);
        case '!=': 
          return eq(column, value).not();
        case '<':
          return column.lt(value);
        case '<=':
          return column.lte(value);
        case '>':
          return column.gt(value);
        case '>=':
          return column.gte(value);
        case '$in':
          return column.in(value);
        case '$contains':
          return like(column, `%${value}%`);
        default:
          return eq(column, value);
      }
    }
    
    // 处理对象形式的条件
    const conditions = Object.entries(whereOption)
      .filter(([key]) => !key.startsWith('$'))
      .map(([key, value]) => eq(table[key], value));
    
    return conditions.length === 1 ? conditions[0] : and(...conditions);
  }
  
  /**
   * 将 QueryOptions.where 转换为简单的过滤器对象
   * 用于 count 方法
   */
  private convertWhereToFilter(where: QueryOptions['where']): Record<string, any> | undefined {
    if (!where) return undefined;
    
    // 只处理简单的对象形式条件
    if (!('field' in where) && !('$and' in where) && !('$or' in where)) {
      return Object.entries(where)
        .filter(([key]) => !key.startsWith('$'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    }
    
    return undefined;
  }
  
  /**
   * 处理查询结果
   * 确保日期字段正确转换
   */
  private processResult<T>(result: any): T {
    if (!result) return result;
    
    // 处理日期字段
    const processed = { ...result };
    if (processed.createdAt && typeof processed.createdAt === 'string') {
      processed.createdAt = new Date(processed.createdAt);
    }
    if (processed.updatedAt && typeof processed.updatedAt === 'string') {
      processed.updatedAt = new Date(processed.updatedAt);
    }
    
    return processed as T;
  }

  private applyFilter(entities: BaseEntity[], where: QueryOptions['where']): BaseEntity[] {
    if (!where) return entities;
    
    // 处理复杂条件
    if ('$and' in where) {
      return where.$and!.reduce((filtered, condition) => {
        return this.applyFilter(filtered, condition);
      }, entities);
    }
    
    if ('$or' in where) {
      const results = new Set<BaseEntity>();
      where.$or!.forEach(condition => {
        this.applyFilter(entities, condition).forEach(entity => results.add(entity));
      });
      return Array.from(results);
    }
    
    // 处理简单条件
    if ('field' in where && 'operator' in where && 'value' in where) {
      return entities.filter(entity => {
        const fieldValue = entity[where.field as keyof BaseEntity];
        switch (where.operator) {
          case '==':
            return fieldValue === where.value;
          case '!=':
            return fieldValue !== where.value;
          case '<':
            return fieldValue < where.value;
          case '<=':
            return fieldValue <= where.value;
          case '>':
            return fieldValue > where.value;
          case '>=':
            return fieldValue >= where.value;
          case '$in':
            return Array.isArray(where.value) && where.value.includes(fieldValue);
          case '$contains':
            return String(fieldValue).includes(String(where.value));
          default:
            return false;
        }
      });
    }
    
    // 处理对象形式的条件
    return entities.filter(entity => {
      return Object.entries(where).every(([key, value]) => {
        if (key.startsWith('$')) return true; // 跳过特殊操作符
        return entity[key as keyof BaseEntity] === value;
      });
    });
  }

  private applySort(entities: BaseEntity[], orderBy: QueryOptions['orderBy']): BaseEntity[] {
    if (!orderBy) return entities;
    
    return [...entities].sort((a, b) => {
      const aValue = a[orderBy.field as keyof BaseEntity];
      const bValue = b[orderBy.field as keyof BaseEntity];
      
      if (aValue === bValue) return 0;
      
      const direction = orderBy.direction === 'asc' ? 1 : -1;
      return aValue < bValue ? -1 * direction : 1 * direction;
    });
  }

  // IDatabaseClient 接口实现 - 特定于表的方法
  async findUsers(query?: any): Promise<User[]> {
    const filter = this.formatFilter(query);
    const users = await this.findAll('users', filter) as User[];
    return users;
  }

  async findMatches(query?: any): Promise<Match[]> {
    const filter = this.formatFilter(query);
    const matches = await this.findAll('matches', filter) as Match[];
    return matches;
  }

  async findMessages(query?: any): Promise<Message[]> {
    const filter = this.formatFilter(query);
    const messages = await this.findAll('messages', filter) as Message[];
    return messages;
  }

  async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = await this.create('users', data as User) as User;
    return user;
  }

  async createMatch(data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<Match> {
    const match = await this.create('matches', data as Match) as Match;
    return match;
  }

  async createMessage(data: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    const message = await this.create('messages', data as Message) as Message;
    return message;
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    await this.update('users', id, data);
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<void> {
    await this.update('matches', id, data);
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<void> {
    await this.update('messages', id, data);
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

  // 事务支持
  async transaction<T>(callback: (tx: IDatabaseTransaction) => Promise<T>): Promise<T> {
    // 如果使用 Drizzle ORM，则使用 Drizzle 的事务
    if (this.drizzleDB) {
      try {
        return await this.drizzleDB.transaction(async (tx: any) => {
          // 创建一个事务代理对象，将所有操作转发到当前实例，但使用事务上下文
          const txProxy = this as unknown as IDatabaseTransaction;
          return await callback(txProxy);
        });
      } catch (error) {
        console.error('Drizzle 事务失败，回退到内存事务:', error);
        // 回退到内存事务
      }
    }
    
    // 内存事务实现
    await this.beginTransaction();
    try {
      const result = await callback(this as unknown as IDatabaseTransaction);
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }
}