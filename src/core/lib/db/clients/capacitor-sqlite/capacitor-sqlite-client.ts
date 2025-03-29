import { BaseClient } from '../base-client';
import { IDatabaseClient, DatabaseConfig } from '../../interfaces';
import { schemaRegistry } from '../../schema/index';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements } from 'jeep-sqlite/loader';
import { initializeSQLite } from './init-sqlite';
import { SQLITE_CONFIG } from './sqlite-config';
import { SQLiteSyncManager } from './sync-manager';

/**
 * Capacitor SQLite 数据库客户端
 * 用于移动应用和 Web 的离线存储
 */
export class CapacitorSQLiteClient extends BaseClient implements IDatabaseClient {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private syncManager: SQLiteSyncManager;
  private config: DatabaseConfig;
  private dbName: string;
  private isNative: boolean;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
    this.dbName = config.name || SQLITE_CONFIG.database.name;
    this.isNative = Capacitor.isNativePlatform();
    this.syncManager = SQLiteSyncManager.getInstance();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 初始化 SQLite
      await initializeSQLite();

      // 初始化 SQLite 连接
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      
      // 检查数据库连接是否存在
      const isConn = await this.sqlite.isConnection(this.dbName, false);
      
      if (isConn.result) {
        // 如果连接已存在，检索它
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        // 创建新连接
        this.db = await this.sqlite.createConnection(
          this.dbName,
          SQLITE_CONFIG.database.encrypted,
          SQLITE_CONFIG.database.mode,
          SQLITE_CONFIG.database.version,
          false
        );
      }

      // 打开数据库连接
      await this.db.open();

      // 初始化同步管理器
      await this.syncManager.initialize(this.db);

      // 执行迁移
      await this.executeMigrations();
      
      this.initialized = true;
      console.log(`Capacitor SQLite 数据库 "${this.dbName}" 初始化成功`);
    } catch (error) {
      console.error('初始化 Capacitor SQLite 失败:', error);
      throw new Error(`初始化 Capacitor SQLite 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      if (this.sqlite) {
        await this.sqlite.closeConnection(this.dbName, false);
      }
      this.db = null;
      this.initialized = false;
    }
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    
    const schemas = schemaRegistry.getAllSchemas();
    
    try {
      // 开始事务
      await this.db!.beginTransaction();
      
      // 清空所有表
      for (const schema of schemas) {
        // 直接使用 run 方法的正确签名
        await this.db!.run(`DELETE FROM ${schema.name}`, []);
      }
      
      // 提交事务
      await this.db!.commitTransaction();
    } catch (error) {
      // 回滚事务
      if (this.db) {
        await this.db.rollbackTransaction();
      }
      console.error('清空数据库失败:', error);
      throw error;
    }
  }

  // 通用数据访问方法
  async findById<T>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    
    try {
      // 修复查询方法调用
      const result = await this.db!.query(
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [id]
      );
      
      if (result.values && result.values.length > 0) {
        return this.processResult<T>(result.values[0]);
      }
      
      return null;
    } catch (error) {
      console.error(`查询失败 (${tableName}/${id}):`, error);
      return null;
    }
  }

  async findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    
    try {
      let statement = `SELECT * FROM ${tableName}`;
      const values: any[] = [];
      
      // 应用过滤条件
      if (filter && Object.keys(filter).length > 0) {
        const whereClause = this.buildWhereClause(filter, values);
        if (whereClause) {
          statement += ` WHERE ${whereClause}`;
        }
      }
      
      // 修复查询方法调用
      const result = await this.db!.query(statement, values);
      
      if (result.values && result.values.length > 0) {
        return result.values.map((item: Record<string, any>) => 
          this.processResult<T>(item)
        );
      }
      
      return [];
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
    
    // 添加时间戳
    const itemWithTimestamps = this.addTimestamps(data, false);
    
    try {
      await this.db!.beginTransaction();
      
      // 创建本地数据库
      const columns = Object.keys(itemWithTimestamps);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => 
        this.formatValueForStorage(itemWithTimestamps[col as keyof typeof itemWithTimestamps])
      );
      
      await this.db!.run(
        `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );

      // 如果启用同步，则跟踪更改
      if (SQLITE_CONFIG.sync.enabled) {
        await this.syncManager.trackChange({
          entityId: data.id,
          tableName,
          operation: 'create',
          data: itemWithTimestamps
        });
      }

      await this.db!.commitTransaction();
      return itemWithTimestamps;
    } catch (error) {
      if (this.db) {
        await this.db.rollbackTransaction();
      }
      console.error(`创建失败 (${tableName}):`, error);
      throw error;
    }
  }

  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    
    try {
      await this.db!.beginTransaction();
      
      const updatedData = this.addTimestamps({ ...data, id } as T, true);
      const columns = Object.keys(updatedData).filter(key => key !== 'id');
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const values = [
        ...columns.map(col => this.formatValueForStorage(updatedData[col as keyof typeof updatedData])),
        id
      ];

      await this.db!.run(
        `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
        values
      );

      // 如果启用同步，则跟踪更改
      if (SQLITE_CONFIG.sync.enabled) {
        await this.syncManager.trackChange({
          entityId: id,
          tableName,
          operation: 'update',
          data: updatedData
        });
      }

      await this.db!.commitTransaction();
    } catch (error) {
      if (this.db) {
        await this.db.rollbackTransaction();
      }
      console.error(`更新失败 (${tableName}/${id}):`, error);
      throw error;
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    
    try {
      await this.db!.beginTransaction();

      await this.db!.run(
        `DELETE FROM ${tableName} WHERE id = ?`,
        [id]
      );

      // 如果启用同步，则跟踪更改
      if (SQLITE_CONFIG.sync.enabled) {
        await this.syncManager.trackChange({
          entityId: id,
          tableName,
          operation: 'delete'
        });
      }

      await this.db!.commitTransaction();
    } catch (error) {
      if (this.db) {
        await this.db.rollbackTransaction();
      }
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
      // 构建查询
      const selectClause = options.select && options.select.length > 0 
        ? options.select.join(', ') 
        : '*';
      
      let statement = `SELECT ${selectClause} FROM ${tableName}`;
      const values: any[] = [];
      
      // 应用过滤条件
      if (options.where && Object.keys(options.where).length > 0) {
        const whereClause = this.buildWhereClause(options.where, values);
        if (whereClause) {
          statement += ` WHERE ${whereClause}`;
        }
      }
      
      // 应用排序
      if (options.orderBy) {
        const orderFields = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
        const orderClauses = orderFields.map(field => {
          const desc = field.startsWith('-');
          const fieldName = desc ? field.substring(1) : field;
          return `${fieldName} ${desc ? 'DESC' : 'ASC'}`;
        });
        
        statement += ` ORDER BY ${orderClauses.join(', ')}`;
      }
      
      // 应用分页
      if (options.limit !== undefined) {
        statement += ` LIMIT ${options.limit}`;
      }
      
      if (options.offset !== undefined) {
        statement += ` OFFSET ${options.offset}`;
      }
      
      // 修复查询方法调用
      const result = await this.db!.query(statement, values);
      
      if (result.values && result.values.length > 0) {
        return result.values.map((item: Record<string, any>) => 
          this.processResult<T>(item)
        );
      }
      
      return [];
    } catch (error) {
      console.error(`查询失败 (${tableName}):`, error);
      return [];
    }
  }

  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    this.checkInitialized();
    
    try {
      // 修复查询方法调用
      const result = await this.db!.query(query, params || []);
      
      return result.values || [];
    } catch (error) {
      console.error('执行原始查询失败:', error);
      throw error;
    }
  }

  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    this.checkInitialized();
    
    try {
      // 开始事务
      await this.db!.beginTransaction();
      
      try {
        // 创建事务代理
        const trxProxy = { ...this };
        
        // 执行回调
        const result = await callback(trxProxy);
        
        // 提交事务
        await this.db!.commitTransaction();
        
        return result;
      } catch (error) {
        // 回滚事务
        await this.db!.rollbackTransaction();
        throw error;
      }
    } catch (error) {
      console.error('事务执行失败:', error);
      throw error;
    }
  }

  // 实现 IDatabaseClient 接口的通用实体方法
  async saveEntity<T extends { id: string }>(tableName: string, entity: T): Promise<T> {
    if (entity.id) {
      await this.update(tableName, entity.id, entity);
      return entity;
    } else {
      return await this.create(tableName, entity);
    }
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

  // 新增方法：导入 JSON 数据
  async importFromJson(jsonstring: string): Promise<void> {
    this.checkInitialized();
    
    try {
      const result = await this.sqlite!.importFromJson(jsonstring);
      // 添加条件检查，确保 result.changes 存在
      if (!result.changes) {
        throw new Error("导入 JSON 数据失败：无效的结果");
      }
      
      if (result.changes.changes === -1) {
        throw new Error("导入 JSON 数据失败");
      }
    } catch (error) {
      console.error('导入 JSON 数据失败:', error);
      throw error;
    }
  }

  // 新增方法：导出数据到 JSON
  async exportToJson(exportMode: string = "full"): Promise<any> {
    this.checkInitialized();
    
    try {
      // 修正：使用 db 实例而不是 sqlite 实例
      const result = await this.db!.exportToJson(exportMode);
      
      if (result.export) {
        return result.export; // 返回 JsonSQLite 对象
      } else {
        throw new Error("导出 JSON 数据失败");
      }
    } catch (error) {
      console.error('导出 JSON 数据失败:', error);
      throw error;
    }
  }

  // 新增方法：检查表是否存在
  async isTableExists(tableName: string): Promise<boolean> {
    this.checkInitialized();
    
    try {
      const query = `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`;
      // 修复查询方法调用
      const result = await this.db!.query(query, [tableName]);
      
      // 修复：确保返回一个确定的布尔值
      return !!(result.values && result.values.length > 0);
    } catch (error) {
      console.error(`检查表 ${tableName} 是否存在失败:`, error);
      return false;
    }
  }

  // 新增方法：执行多条 SQL 语句
  async executeSet(statements: string[]): Promise<void> {
    this.checkInitialized();
    
    try {
      // 修复 executeSet 方法调用
      const statementsSet = statements.map(statement => ({ statement, values: [] }));
      await this.db!.executeSet(statementsSet);
    } catch (error) {
      console.error('执行多条 SQL 语句失败:', error);
      throw error;
    }
  }

  // 辅助方法
  private async executeMigrations(): Promise<void> {
    try {
      // 获取所有表结构
      const schemas = schemaRegistry.getAllSchemas();
      
      // 准备所有 SQL 语句
      const statements: string[] = [];
      for (const schema of schemas) {
        statements.push(this.generateCreateTableSQL(schema));
      }
      
      // 批量执行所有 SQL 语句
      if (statements.length > 0) {
        // 修复 executeSet 方法调用
        const statementsSet = statements.map(statement => ({ statement, values: [] }));
        await this.db!.executeSet(statementsSet);
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
    sql += '\n)';
    
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

  private buildWhereClause(filter: Record<string, any>, values: any[]): string {
    const conditions: string[] = [];
    
    for (const [key, value] of Object.entries(filter)) {
      if (key === '$or' && Array.isArray(value)) {
        // 处理 $or 操作符
        const orConditions = value.map(subFilter => {
          const subClause = this.buildWhereClause(subFilter, values);
          return `(${subClause})`;
        });
        
        if (orConditions.length > 0) {
          conditions.push(`(${orConditions.join(' OR ')})`);
        }
      } else if (key === '$ne' && typeof value === 'object') {
        // 处理 $ne 操作符
        for (const [neKey, neValue] of Object.entries(value)) {
          conditions.push(`${neKey} != ?`);
          values.push(this.formatValueForStorage(neValue));
        }
      } else if (key === '$contains') {
        // 处理 $contains 操作符（用于文本搜索）
        if (typeof value === 'object' && value !== null) {
          for (const [containsKey, containsValue] of Object.entries(value)) {
            if (typeof containsValue === 'string') {
              conditions.push(`${containsKey} LIKE ?`);
              values.push(`%${containsValue}%`);
            }
          }
        }
      } else if (value === null) {
        // 处理 null 值
        conditions.push(`${key} IS NULL`);
      } else {
        // 处理普通相等条件
        conditions.push(`${key} = ?`);
        values.push(this.formatValueForStorage(value));
      }
    }
    
    return conditions.join(' AND ');
  }

  private formatValueForStorage(value: any): any {
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return value;
  }

  /**
   * 处理数据库结果，转换特殊类型
   */
  private processResult<T>(result: Record<string, any>): T {
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

  // 检查 SQLite 是否可用
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.sqlite) {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
      }
      const echo = await this.sqlite.echo("test");
      return echo.value === "test";
    } catch (error) {
      console.error('SQLite 不可用:', error);
      return false;
    }
  }

  // 获取当前平台
  getPlatform(): string {
    return Capacitor.getPlatform();
  }
}