import { IDatabaseClient, DatabaseConfig } from '@/core/lib/db/interfaces';
import { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database.types';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { DatabaseError, DatabaseErrorCode } from '@/core/lib/db/errors/database-error';
import { getLoggerService } from '@/core/services/infrastructure/logger/registry/logger-registry';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Only import Node.js modules in non-browser environments
let fs: any;
let path: any;
let sqlite3: any;

if (!isBrowser) {
  fs = require('fs');
  path = require('path');
}

/**
 * Mock数据库客户端配置接口
 */
export interface MockDatabaseConfig extends DatabaseConfig {
  /**
   * 数据源模式: 'memory' | 'json' | 'indexeddb' | 'fake-indexeddb' | 'sqlite' | 'csv' | 'sql'
   * - memory: 使用内存中预定义的数据
   * - json: 从JSON文件加载数据
   * - indexeddb: 使用IndexedDB
   * - fake-indexeddb: Node.js 环境下模拟 IndexedDB（全 CRUD，便于迁移）
   * - sqlite: 使用 SQLite（Node.js 环境，支持文件和内存模式，推荐移动端开发/测试）
   * - csv: 从 CSV 文件加载数据
   * - sql: 从 SQL 文件加载数据
   * @default 'memory'
   */
  mockMode?: 'memory' | 'json' | 'indexeddb' | 'fake-indexeddb' | 'sqlite' | 'csv' | 'sql';

  /**
   * JSON文件路径（当mockMode为'json'时使用）
   * 如果提供相对路径，将相对于当前工作目录解析
   */
  jsonFilePath?: string;

  /**
   * CSV文件目录（当mockMode为'csv'时使用）
   * 如果提供相对路径，将相对于当前工作目录解析
   */
  csvDir?: string;

  /**
   * SQL文件目录（当mockMode为'sql'时使用）
   * 如果提供相对路径，将相对于当前工作目录解析
   */
  sqlDir?: string;

  /**
   * SQLite 文件路径（mockMode=sqlite 时使用）
   * ':memory:' 代表内存数据库
   */
  sqliteFilePath?: string;

  /**
   * 是否自动保存对JSON文件的更改
   * 仅在mockMode为'json'时适用
   * @default false
   */
  autoSave?: boolean;

  name: string;
  version: number;
  engine: 'mock';
  tables: Record<string, TableConfig>;
}

export interface TableConfig {
  columns: Record<string, ColumnConfig>;
}

export interface ColumnConfig {
  type: string;
  constraints?: string[];
}

export interface MockQueryOptions {
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

/**
 * 模拟数据库客户端
 * 用于测试和开发环境
 * 支持内存模式和JSON文件模式
 */
export class MockDatabaseClient implements IDatabaseClient {
  private data: Record<string, Map<string, any>> = {};
  private mockConfig: Required<Pick<MockDatabaseConfig, 'mockMode' | 'jsonFilePath' | 'csvDir' | 'sqlDir' | 'autoSave' | 'sqliteFilePath'>>;
  private isInitialized: boolean = false;
  protected transactionActive: boolean = false;
  private logger;
  private sqliteDb: any;

  constructor(private config: MockDatabaseConfig) {
    this.mockConfig = {
      mockMode: config.mockMode || (process.env.MOCK_DB_MODE as any) || 'memory',
      jsonFilePath: config.jsonFilePath || './mock-data.json',
      csvDir: config.csvDir || './mock-csv',
      sqlDir: config.sqlDir || './mock-sql',
      autoSave: config.autoSave ?? true,
      sqliteFilePath: config.sqliteFilePath || process.env.MOCK_SQLITE_FILE || ':memory:'
    };
    this.logger = getLoggerService();
  }

  async connect(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    this.logger.info('Mock database connected');
  }

  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      await this.close();
    }
    this.logger.info('Mock database disconnected');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.debug('Mock database client already initialized, skipping initialization');
      return;
    }

    this.logger.debug('Initializing mock database client');
    try {
      if (this.mockConfig.mockMode === 'json') {
        await this.loadFromJson();
      } else if (this.mockConfig.mockMode === 'fake-indexeddb') {
        // 动态引入 fake-indexeddb 并初始化
        const { indexedDB } = await import('fake-indexeddb');
        (globalThis as any).indexedDB = indexedDB;
        // 可选：初始化表结构和演示数据（可参考 indexeddb 方案）
        // 具体实现略，需根据实际 indexeddb schema/init 逻辑补充
        this.logger.info('Initialized with fake-indexeddb');
      } else if (this.mockConfig.mockMode === 'sqlite') {
        // 动态引入 sqlite3
        sqlite3 = require('sqlite3').verbose();
        this.sqliteDb = new sqlite3.Database(this.mockConfig.sqliteFilePath);
        // 初始化表结构和 mock/config 数据
        await this.initSQLiteSchemaAndData();
        this.logger.info(`Initialized with SQLite: ${this.mockConfig.sqliteFilePath}`);
      } else if (this.mockConfig.mockMode === 'csv') {
        await this.loadFromCsv();
        this.logger.info('Initialized with CSV mock data');
      } else if (this.mockConfig.mockMode === 'sql') {
        await this.loadFromSql();
        this.logger.info('Initialized with SQL mock data');
      } else {
        // 加载 src/core/lib/db/data/mock 下的 mock 数据（每个集合一个 ts 文件导出数组）
        // 动态 require 目录下所有 .mock.ts 文件
        const mockModules = [
          'user.mock',
          'match.mock',
          'message.mock',
          'quiz.mock',
          'report.mock',
          'gift.mock',
          'skin.mock',
          'translation.mock',
          'config.mock',
          'member-growth.mock',
          'member-growth-task.mock',
          'member-growth-task.mock.30days',
          'global-config.mock',
        ];
        for (const mod of mockModules) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const records = require(`@/core/lib/db/data/mock/${mod}`).default;
            if (Array.isArray(records)) {
              const collection = mod.replace(/\.mock.*/, '');
              const table = this.getTable(collection);
              for (const record of records) {
                table.set(record.id, record);
              }
            }
          } catch (e) {
            this.logger.warn(`Mock data module load failed: ${mod}`, e);
          }
        }
      }
      this.isInitialized = true;
      this.logger.debug('Mock database client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize mock database client', { error });
      throw new DatabaseError(
        `Failed to initialize mock database client: ${error instanceof Error ? error.message : String(error)}`,
        DatabaseErrorCode.INITIALIZATION_ERROR,
        error
      );
    }
  }

  async close(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    this.logger.debug('Closing mock database client');
    if (this.mockConfig.mockMode === 'json' && this.mockConfig.autoSave) {
      await this.saveToJson();
    }
    if (this.mockConfig.mockMode === 'sqlite') {
      this.sqliteDb.close();
    }
    this.data = {};
    this.isInitialized = false;
    this.logger.debug('Mock database client closed');
  }

  async clear(): Promise<void> {
    this.validateInitialized();
    this.logger.debug('Clearing all data');
    this.data = {};
    if (this.mockConfig.mockMode === 'json') {
      await this.saveToJson();
    }
    this.logger.debug('All data cleared');
  }

  async query<T>(collection: string, query: any): Promise<QueryResult<T>> {
    this.validateInitialized();
    this.logger.debug(`Querying ${collection}`, query);
    const table = this.getTable(collection);
    const records = Array.from(table.values()) as T[];
    if (!query) {
      return {
        data: records,
        total: records.length,
        hasMore: false
      };
    }

    let filtered = records;
    if (typeof query === 'object') {
      if (query.filter && typeof query.filter === 'function') {
        filtered = records.filter(query.filter);
      } else if (query.where) {
        filtered = records.filter(record => {
          if ('$and' in query.where) {
            return (query.where.$and || []).every((condition: any) => 
              this.matchesCondition(record, condition)
            );
          } else if ('$or' in query.where) {
            return (query.where.$or || []).some((condition: any) => 
              this.matchesCondition(record, condition)
            );
          } else {
            return this.matchesCondition(record, query.where);
          }
        });
      } else {
        filtered = records.filter(record => {
          return Object.entries(query).every(([key, value]) => {
            if (key === 'email') {
              this.logger.debug('Checking email match', { 
                recordEmail: (record as any)[key], 
                queryEmail: value 
              });
            }
            return (record as any)[key] === value;
          });
        });
      }
    }
    if (query.orderBy) {
      const { field, direction } = query.orderBy;
      filtered.sort((a, b) => {
        const aValue = (a as Record<string, any>)[field];
        const bValue = (b as Record<string, any>)[field];
        return direction === 'asc' ? 
          (aValue > bValue ? 1 : -1) :
          (aValue < bValue ? 1 : -1);
      });
    }
    const offset = query.offset || 0;
    const limit = query.limit || filtered.length;
    const paginatedRecords = filtered.slice(offset, offset + limit);
    this.logger.debug(`Query results for ${collection}`, {
      total: filtered.length,
      returned: paginatedRecords.length,
      hasMore: offset + limit < filtered.length
    });

    return {
      data: paginatedRecords,
      total: filtered.length,
      hasMore: offset + limit < filtered.length
    };
  }

  private matchesCondition<T>(record: T, condition: QueryOptions['where']): boolean {
    if (!condition || typeof condition !== 'object') return true;
    if ('field' in condition) {
      const { field, operator, value } = condition;
      const recordValue = (record as Record<string, any>)[field];
      switch (operator) {
        case '==':
          return recordValue === value;
        case '!=':
          return recordValue !== value;
        case '>':
          return recordValue > value;
        case '>=':
          return recordValue >= value;
        case '<':
          return recordValue < value;
        case '<=':
          return recordValue <= value;
        case '$in':
          return Array.isArray(value) && value.includes(recordValue);
        case '$contains':
          return String(recordValue).includes(String(value));
        default:
          return false;
      }
    }
    return Object.entries(condition).every(([key, value]) => 
      (record as Record<string, any>)[key] === value
    );
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    this.validateInitialized();
    this.logger.debug(`Finding record by id in ${collection}`, { id });
    const table = this.getTable(collection);
    const record = table.get(id) as T;
    return record || null;
  }

  async findAll<T extends BaseEntity>(collection: string, filter?: Record<string, any>): Promise<T[]> {
    this.validateInitialized();
    this.logger.debug(`Finding all records in ${collection}`, { filter });
    const table = this.getTable(collection);
    const records = Array.from(table.values()) as T[];
    if (filter) {
      return records.filter(record => 
        Object.entries(filter).every(([key, value]) => 
          (record as Record<string, any>)[key] === value
        )
      );
    }
    return records;
  }

  async create<T>(collection: string, data: Partial<T>): Promise<T> {
    this.validateInitialized();
    this.logger.debug(`Creating record in ${collection}`, data);
    const table = this.getTable(collection);
    const id = (data as any).id || this.generateId();
    const timestamp = new Date();
    const record = {
      id,
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    } as T;
    table.set(id, record);
    if (this.mockConfig.mockMode === 'json') {
      await this.saveToJson();
    }
    this.logger.debug(`Record created in ${collection}`, { id });
    return record;
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    this.validateInitialized();
    this.logger.debug(`Updating record in ${collection}`, { id, data });
    const table = this.getTable(collection);
    const existing = table.get(id);
    if (!existing) {
      throw new DatabaseError(
        `Record not found in ${collection}`,
        DatabaseErrorCode.NOT_FOUND
      );
    }
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    } as T;
    table.set(id, updated);
    if (this.mockConfig.mockMode === 'json') {
      await this.saveToJson();
    }
    this.logger.debug(`Record updated in ${collection}`, { id });
    return updated;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    this.validateInitialized();
    this.logger.debug(`Deleting record from ${collection}`, { id });
    const table = this.getTable(collection);
    const exists = table.has(id);
    if (!exists) {
      throw new DatabaseError(
        `Record not found in ${collection}`,
        DatabaseErrorCode.NOT_FOUND
      );
    }
    const success = table.delete(id);
    if (success && this.mockConfig.mockMode === 'json') {
      await this.saveToJson();
    }
    this.logger.debug(`Record deleted from ${collection}`, { id, success });
    return success;
  }

  async count(collection: string, filter?: Record<string, any>): Promise<number> {
    this.validateInitialized();
    this.logger.debug(`Counting records in ${collection}`, { filter });
    const table = this.getTable(collection);
    let count = table.size;
    if (filter) {
      count = Array.from(table.values()).filter(record => 
        Object.entries(filter).every(([key, value]) => record[key] === value)
      ).length;
    }
    return count;
  }

  async beginTransaction(): Promise<void> {
    this.validateInitialized();
    if (this.transactionActive) {
      throw new DatabaseError(
        'Transaction already in progress',
        DatabaseErrorCode.TRANSACTION_ERROR
      );
    }
    this.transactionActive = true;
  }

  async commitTransaction(): Promise<void> {
    this.validateInitialized();
    if (!this.transactionActive) {
      throw new DatabaseError(
        'No active transaction',
        DatabaseErrorCode.TRANSACTION_ERROR
      );
    }
    this.transactionActive = false;
  }

  async rollbackTransaction(): Promise<void> {
    this.validateInitialized();
    if (!this.transactionActive) {
      throw new DatabaseError(
        'No active transaction',
        DatabaseErrorCode.TRANSACTION_ERROR
      );
    }
    this.transactionActive = false;
  }

  async batch<T extends BaseEntity>(collection: string, operations: BatchOperation<T>[]): Promise<void> {
    this.validateInitialized();
    this.logger.debug(`Executing batch operations on ${collection}`, { operationCount: operations.length });
    try {
      await this.beginTransaction();
      for (const operation of operations) {
        switch (operation.type) {
          case 'add':
            await this.create<T>(collection, operation.data);
            break;
          case 'put':
            if ('id' in operation.data) {
              await this.update<T>(collection, operation.data.id, operation.data);
            } else {
              await this.create<T>(collection, operation.data);
            }
            break;
          case 'delete':
            if ('id' in operation.data) {
              await this.delete(collection, operation.data.id);
            }
            break;
        }
      }
      await this.commitTransaction();
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }

  async executeRawQuery<R>(query: string, params?: any[]): Promise<R[]> {
    this.validateInitialized();
    this.logger.debug('Executing raw query in mock client', { query, params });
    this.logger.warn('Raw queries are not supported in mock client');
    return [];
  }

  private getTable(collection: string): Map<string, any> {
    if (!this.data[collection]) {
      this.data[collection] = new Map();
    }
    return this.data[collection];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private async loadFromJson(): Promise<void> {
    if (isBrowser) {
      this.mockConfig.mockMode = 'memory';
      return;
    }

    try {
      const filePath = this.mockConfig.jsonFilePath;
      if (!filePath) {
        throw new DatabaseError(
          'JSON file path is required when mockMode is set to "json"',
          DatabaseErrorCode.INITIALIZATION_ERROR
        );
      }

      if (!fs.existsSync(filePath)) {
        this.logger.warn(`JSON file not found: ${filePath}. Using empty data.`);
        return;
      }

      const jsonData = await fs.promises.readFile(filePath, 'utf8');
      const data = JSON.parse(jsonData);

      for (const [collection, records] of Object.entries(data)) {
        this.data[collection] = new Map(Object.entries(records as Record<string, any>));
      }
    } catch (error) {
      this.logger.error('Failed to load data from JSON file', { error });
      throw new DatabaseError(
        `Failed to load data from JSON file: ${error instanceof Error ? error.message : String(error)}`,
        DatabaseErrorCode.OPERATION_FAILED
      );
    }
  }

  private async saveToJson(): Promise<void> {
    if (isBrowser) {
      this.logger.warn('Saving to JSON file is not supported in browser environment');
      return;
    }

    try {
      const filePath = this.mockConfig.jsonFilePath;
      if (!filePath) {
        throw new DatabaseError(
          'JSON file path is required when mockMode is set to "json"',
          DatabaseErrorCode.INITIALIZATION_ERROR
        );
      }

      const jsonData: Record<string, Record<string, any>> = {};
      for (const [collection, records] of Object.entries(this.data)) {
        jsonData[collection] = Object.fromEntries(records as Map<string, any>);
      }

      await fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    } catch (error) {
      this.logger.error('Failed to save data to JSON file', { error });
      throw new DatabaseError(
        `Failed to save data to JSON file: ${error instanceof Error ? error.message : String(error)}`,
        DatabaseErrorCode.OPERATION_FAILED
      );
    }
  }

  private async loadFromCsv(): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { parse } = await import('csv-parse/sync');
    const csvDir = this.mockConfig.csvDir || path.join(process.cwd(), 'mock-csv');
    const files = await fs.readdir(csvDir);
    for (const file of files) {
      if (file.endsWith('.csv')) {
        const filePath = path.join(csvDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const records = parse(content, { columns: true });
        // 假设文件名 user.csv -> this.mockData['user']
        const key = path.basename(file, '.csv');
        this.data[key] = new Map(Object.entries(records));
        this.logger.info(`Loaded CSV mock data for ${key}, count: ${records.length}`);
      }
    }
  }

  private async loadFromSql(): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const sqlDir = this.mockConfig.sqlDir || path.join(process.cwd(), 'mock-sql');
    const files = await fs.readdir(sqlDir);
    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(sqlDir, file);
        const sql = await fs.readFile(filePath, 'utf8');
        if (this.sqliteDb) {
          await new Promise((resolve, reject) => {
            this.sqliteDb.exec(sql, (err: any) => {
              if (err) reject(err); else resolve(null);
            });
          });
          this.logger.info(`Executed SQL file: ${file}`);
        } else {
          // 这里可以根据实际 mock 数据结构做解析填充
          this.logger.warn(`SQL mock mode: skipping SQL execution (sqliteDb not available): ${file}`);
        }
      }
    }
  }

  /**
   * 初始化 SQLite 表结构和 mock/config 数据（自动导入所有表）
   */
  private async initSQLiteSchemaAndData(): Promise<void> {
    // 1. 动态加载所有 schema
    const schemaDir = path.resolve(__dirname, '../../../../services/infrastructure/config/schema');
    const schemaFiles = fs.readdirSync(schemaDir).filter((f: string) => f.endsWith('.schema.ts'));
    const schemas: Record<string, any> = {};
    for (const file of schemaFiles) {
      const schemaMod = require(path.join(schemaDir, file));
      // 约定：每个 schema 文件导出一个 xxxConfigSchema 或 xxxSchema
      for (const key of Object.keys(schemaMod)) {
        if (key.endsWith('ConfigSchema') || key.endsWith('Schema')) {
          schemas[key.replace(/ConfigSchema|Schema/, '').toLowerCase()] = schemaMod[key];
        }
      }
    }

    // 2. 动态加载所有 mock 配置
    const mockDir = path.resolve(__dirname, '../../../../services/infrastructure/config/types');
    const mockFiles = fs.readdirSync(mockDir).filter((f: string) => f.match(/\.mock(\.|$)/));
    const mockData: Record<string, any[]> = {};
    for (const file of mockFiles) {
      const mockMod = require(path.join(mockDir, file));
      for (const [key, value] of Object.entries(mockMod)) {
        // 约定：mock 配置为数组或对象（如 translationMockData、mockSkinConfig）
        if (Array.isArray(value)) {
          // 如 translationMockData
          mockData[key.replace(/^mock|Config|Data/gi, '').toLowerCase()] = value;
        } else if (typeof value === 'object' && value !== null) {
          // 如 mockSkinConfig、mockGiftConfig、mockMemberGrowthConfig
          // 若包含数组字段（如 skins/items/levels），则以字段名为表名
          for (const [k, v] of Object.entries(value)) {
            if (Array.isArray(v)) {
              mockData[k.toLowerCase()] = v;
            }
          }
        }
      }
    }

    // 3. 自动建表并批量插入
    await new Promise<void>((resolve, reject) => {
      this.sqliteDb.serialize(() => {
        for (const [table, schema] of Object.entries(schemas)) {
          // 仅为有 mock 数据的表建表
          if (!mockData[table]) continue;
          // 简单推断字段类型（可扩展为更强类型映射）
          const sample = mockData[table][0];
          const columns = Object.keys(sample).map(col => {
            let type = 'TEXT';
            if (typeof sample[col] === 'number') type = 'REAL';
            if (typeof sample[col] === 'boolean') type = 'INTEGER';
            return `"${col}" ${type}`;
          });
          const createSQL = `CREATE TABLE IF NOT EXISTS "${table}" (${columns.join(',')})`;
          this.sqliteDb.run(createSQL);
          // 批量插入
          for (const row of mockData[table]) {
            const fields = Object.keys(row);
            const placeholders = fields.map(() => '?').join(',');
            const insertSQL = `INSERT OR IGNORE INTO "${table}" (${fields.map(f => `"${f}"`).join(',')}) VALUES (${placeholders})`;
            this.sqliteDb.run(insertSQL, fields.map(f => row[f]));
          }
        }
        resolve();
      });
    });
  }

  private validateInitialized(): void {
    if (!this.isInitialized) {
      throw new DatabaseError(
        'Database client not initialized. Call initialize() first.',
        DatabaseErrorCode.CLIENT_NOT_INITIALIZED
      );
    }
  }
}