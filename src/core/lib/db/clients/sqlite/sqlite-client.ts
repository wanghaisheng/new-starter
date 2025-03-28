import { BaseClient } from '../base-client';
import { IDatabaseClient, DatabaseConfig } from '../../interfaces';
import { drizzleSchema } from '../../schema/drizzle-schema';
import { schemaRegistry, DatabaseType } from '../../schema/index';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, and, or, like, isNull, not } from 'drizzle-orm/expressions';
import Database from 'better-sqlite3';

/**
 * SQLite 数据库客户端
 * 使用 Drizzle ORM 实现
 */
export class SQLiteClient extends BaseClient implements IDatabaseClient {
  private db: any = null;
  private drizzleDB: any = null;
  private config: DatabaseConfig;
  private dbType: DatabaseType = 'sqlite';

  constructor(config: DatabaseConfig) {
    super();
    this.config = {
      name: ':memory:', // 默认使用内存数据库
      ...config
    };
    
    // 如果配置中指定了引擎类型，使用该类型
    if (config.engine && typeof config.engine === 'string') {
      this.dbType = config.engine as DatabaseType;
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 创建 SQLite 数据库连接
      this.db = new Database(this.config.name as string);
      
      // 初始化 Drizzle ORM
      this.drizzleDB = drizzle(this.db);
      
      // 执行迁移
      this.executeMigrations();
      
      this.initialized = true;
    } catch (error) {
      console.error('初始化 SQLite 失败:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.drizzleDB = null;
      this.initialized = false;
    }
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    
    // 获取所有表名并清空数据
    const schemas = schemaRegistry.getAllSchemas();
    for (const schema of schemas) {
      try {
        this.db.exec(`DELETE FROM ${schema.name}`);
      } catch (error) {
        console.warn(`清空表 ${schema.name} 失败:`, error);
      }
    }
  }

  // 通用数据访问方法
  async findById<T>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    
    try {
      const table = this.getTable(tableName);
      const result = await this.drizzleDB.select().from(table).where(eq(table.id, id)).get();
      return this.processResult<T>(result);
    } catch (error) {
      console.error(`查询失败 (${tableName}/${id}):`, error);
      return null;
    }
  }

  async findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    
    try {
      const table = this.getTable(tableName);
      let query = this.drizzleDB.select().from(table);
      
      // 应用过滤条件
      if (filter && Object.keys(filter).length > 0) {
        const formattedFilter = this.formatFilter(filter);
        if (Object.keys(formattedFilter).length > 0) {
          query = query.where(this.buildWhereClause(table, formattedFilter));
        }
      }
      
      const results = await query.all();
      return results.map((result: Record<string, any>) => this.processResult<T>(result));
    } catch (error) {
      console.error(`查询失败 (${tableName}):`, error);
      return [];
    }
  }

  async create<T extends { id: string }>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    
    // 确保有 ID
    if (!data.id) {
      data.id = this.generateId();
    }
    
    // 添加时间戳并处理数据
    const itemWithTimestamps = this.addTimestamps(data, false);
    const processedData = this.prepareDataForStorage(tableName, itemWithTimestamps);
    
    try {
      const table = this.getTable(tableName);
      await this.drizzleDB.insert(table).values(processedData).run();
      return itemWithTimestamps;
    } catch (error) {
      console.error(`创建失败 (${tableName}):`, error);
      throw error;
    }
  }

  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    
    try {
      const table = this.getTable(tableName);
      
      // 更新数据并处理
      const updatedData = this.addTimestamps({ ...data, id } as T, true);
      const processedData = this.prepareDataForStorage(tableName, updatedData);
      
      await this.drizzleDB.update(table)
        .set(processedData)
        .where(eq(table.id, id))
        .run();
    } catch (error) {
      console.error(`更新失败 (${tableName}/${id}):`, error);
      throw error;
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    
    try {
      const table = this.getTable(tableName);
      await this.drizzleDB.delete(table).where(eq(table.id, id)).run();
    } catch (error) {
      console.error(`删除失败 (${tableName}/${id}):`, error);
      throw error;
    }
  }

  async query<T>(tableName: string, options: {
    select?: string[];
    where?: Record<string, any>;
    orderBy?: string | string[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    this.checkInitialized();
    
    try {
      const table = this.getTable(tableName);
      
      // 构建基础查询
      let query = this.drizzleDB.select();
      
      // 应用字段选择
      if (options.select && options.select.length > 0) {
        const columns = options.select.map(field => table[field]);
        query = query.columns(columns);
      }
      
      // 添加表
      query = query.from(table);
      
      // 应用过滤条件
      if (options.where && Object.keys(options.where).length > 0) {
        const formattedFilter = this.formatFilter(options.where);
        if (Object.keys(formattedFilter).length > 0) {
          query = query.where(this.buildWhereClause(table, formattedFilter));
        }
      }
      
      // 应用排序
      if (options.orderBy) {
        const orderFields = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
        
        for (const field of orderFields) {
          const desc = field.startsWith('-');
          const fieldName = desc ? field.substring(1) : field;
          
          if (desc) {
            query = query.orderBy(table[fieldName], 'desc');
          } else {
            query = query.orderBy(table[fieldName], 'asc');
          }
        }
      }
      
      // 应用分页
      if (options.limit !== undefined) {
        query = query.limit(options.limit);
      }
      
      if (options.offset !== undefined) {
        query = query.offset(options.offset);
      }
      
      const results = await query.all();
      return results.map((result: Record<string, any>) => this.processResult<T>(result));
    } catch (error) {
      console.error(`查询失败 (${tableName}):`, error);
      return [];
    }
  }

  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    this.checkInitialized();
    
    try {
      if (params) {
        const stmt = this.db.prepare(query);
        return stmt.all(...params);
      } else {
        return this.db.exec(query);
      }
    } catch (error) {
      console.error('执行原始查询失败:', error);
      throw error;
    }
  }

  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    this.checkInitialized();
    
    try {
      // 开始事务
      const trx = this.db.transaction(() => {
        // 创建事务代理
        const trxProxy = {
          ...this,
          db: this.db,
          drizzleDB: this.drizzleDB
        };
        
        // 执行回调
        return callback(trxProxy);
      });
      
      // 执行事务
      return trx();
    } catch (error) {
      console.error('事务执行失败:', error);
      throw error;
    }
  }

  // 实现 IDatabaseClient 接口的通用实体方法
  async saveEntity<T extends { id: string }>(tableName: string, entity: T): Promise<T> {
    if (entity.id) {
      await this.update(tableName, entity.id, entity);
    } else {
      entity.id = this.generateId();
      await this.create(tableName, entity);
    }
    return entity;
  }

  async getEntity<T>(tableName: string, id: string): Promise<T | null> {
    return this.findById<T>(tableName, id);
  }

  async getAllEntities<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    return this.findAll<T>(tableName, filter);
  }

  async updateEntity<T extends { id: string }>(tableName: string, entity: T): Promise<T> {
    await this.update(tableName, entity.id, entity);
    return entity;
  }

  async deleteEntity(tableName: string, id: string): Promise<boolean> {
    await this.delete(tableName, id);
    return true;
  }

  async getEntitiesByRelation<T>(
    tableName: string, 
    relationField: string, 
    relationId: string
  ): Promise<T[]> {
    return this.findAll<T>(tableName, { [relationField]: relationId });
  }

  // 辅助方法
  private executeMigrations(): void {
    try {
      // 获取所有表结构
      const schemas = schemaRegistry.getAllSchemas();
      
      // 为每个表生成创建表的 SQL
      for (const schema of schemas) {
        const createTableSQL = this.generateCreateTableSQL(schema);
        this.db.exec(createTableSQL);
      }
    } catch (error) {
      console.error('执行迁移失败:', error);
      throw error;
    }
  }

  private generateCreateTableSQL(schema: any): string {
    // 使用 schemaRegistry 中的表结构生成 SQL
    let sql = `CREATE TABLE IF NOT EXISTS ${schema.name} (\n`;
    
    // 列定义
    const columnDefs = schema.columns.map((column: any) => {
      let def = `  ${column.name} ${this.getSQLiteType(column.type)}`;
      
      if (column.primaryKey) {
        def += ' PRIMARY KEY';
      }
      
      if (column.notNull) {
        def += ' NOT NULL';
      }
      
      if (column.unique) {
        def += ' UNIQUE';
      }
      
      if (column.defaultValue !== undefined && typeof column.defaultValue !== 'function') {
        def += ` DEFAULT ${this.formatDefaultValue(column.defaultValue)}`;
      }
      
      if (column.references) {
        def += ` REFERENCES ${column.references.table}(${column.references.column})`;
      }
      
      return def;
    });
    
    sql += columnDefs.join(',\n');
    sql += '\n);\n';
    
    // 索引定义
    if (schema.indexes && schema.indexes.length > 0) {
      for (const index of schema.indexes) {
        sql += `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${index.name} ON ${schema.name} (${index.columns.join(', ')});\n`;
      }
    }
    
    return sql;
  }

  private getSQLiteType(type: string): string {
    switch (type.toLowerCase()) {
      case 'string':
      case 'text':
        return 'TEXT';
      case 'integer':
      case 'number':
      case 'boolean':
        return 'INTEGER';
      case 'real':
      case 'float':
      case 'double':
        return 'REAL';
      case 'blob':
        return 'BLOB';
      case 'date':
      case 'json':
      case 'array':
        return 'TEXT';
      default:
        return 'TEXT';
    }
  }

  private formatDefaultValue(value: any): string {
    if (value === null) {
      return 'NULL';
    }
    
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    
    return String(value);
  }

  /**
   * 处理数据库结果，转换特殊类型
   */
  private processResult<T>(result: Record<string, any> | null): T | null {
    if (!result) return null;
    
    const processed: Record<string, any> = { ...result };
    
    // 处理日期字段
    for (const key in processed) {
      // 检查是否是日期字符串
      if (typeof processed[key] === 'string' && 
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(processed[key])) {
        processed[key] = new Date(processed[key]);
      }
      
      // 处理 JSON 字段
      if (typeof processed[key] === 'string' && 
          (processed[key].startsWith('{') || processed[key].startsWith('['))) {
        try {
          processed[key] = JSON.parse(processed[key]);
        } catch (e) {
          // 不是有效的 JSON，保持原样
        }
      }
    }
    
    return processed as T;
  }

  /**
   * 准备数据用于存储
   */
  private prepareDataForStorage<T extends Record<string, any>>(tableName: string, data: T): Record<string, any> {
    const schema = schemaRegistry.getSchema(tableName);
    if (!schema) return data;
    
    const result: Record<string, any> = {};
    
    // 处理每个字段
    for (const key in data) {
      const column = schema.columns.find((col: any) => col.name === key);
      if (!column) {
        result[key] = data[key];
        continue;
      }
      
      // 根据列类型处理数据
      switch (column.type.toLowerCase()) {
        case 'date':
          // 日期转字符串
          if (typeof data[key] === 'object' && data[key] !== null && 'toISOString' in data[key]) {
            result[key] = (data[key] as Date).toISOString();
          } else {
            result[key] = data[key];
          }
          break;
        case 'json':
        case 'array':
          // 对象/数组转 JSON 字符串
          if (typeof data[key] === 'object' && data[key] !== null) {
            result[key] = JSON.stringify(data[key]);
          } else {
            result[key] = data[key];
          }
          break;
        default:
          result[key] = data[key];
      }
    }
    
    return result;
  }

  private getTable(tableName: string): any {
    // 首先尝试从 drizzleSchema 获取
    if (drizzleSchema && typeof drizzleSchema === 'object' && tableName in drizzleSchema) {
      return (drizzleSchema as Record<string, any>)[tableName];
    }
    
    // 如果不存在，尝试从 schemaRegistry 获取并转换
    const schema = schemaRegistry.getSchema(tableName);
    if (schema) {
      return schemaRegistry.getTableDefinition(tableName, this.dbType);
    }
    
    throw new Error(`表不存在: ${tableName}`);
  }

  private buildWhereClause(table: any, filter: Record<string, any>): any {
    // 处理特殊操作符
    if (filter.$or && Array.isArray(filter.$or)) {
      // 处理 $or 操作符
      return or(...filter.$or.map(subFilter => this.buildWhereClause(table, subFilter)));
    }
    
    // 处理普通条件
    const conditions = [];
    
    for (const [key, value] of Object.entries(filter)) {
      if (key === '$or') continue; // 已处理
      
      if (key === '$ne' && typeof value === 'object') {
        // 处理 $ne 操作符
        for (const [neKey, neValue] of Object.entries(value)) {
          // 修复: 使用 not(eq()) 而不是 eq().not()
          conditions.push(not(eq(table[neKey], neValue)));
        }
      } else if (key === '$contains' && typeof value === 'string') {
        // 处理 $contains 操作符（用于文本搜索）
        conditions.push(like(table[key], `%${value}%`));
      } else if (value === null) {
        // 处理 null 值
        conditions.push(isNull(table[key]));
      } else {
        // 处理普通相等条件
        conditions.push(eq(table[key], value));
      }
    }
    
    // 组合所有条件
    return conditions.length > 1 ? and(...conditions) : conditions[0];
  }
}