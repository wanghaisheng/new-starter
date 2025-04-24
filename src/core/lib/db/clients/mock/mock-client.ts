import { BaseClient } from '@/core/lib/db/clients/base-client';
import { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { createDatabaseError, DatabaseErrorCode } from '../../types/database-error';
import { configService } from '@/core/services/infrastructure/config';

// 临时兼容处理：mock logger

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

let fs: any;
let path: any;
let sqlite3: any;

if (!isBrowser) {
  fs = require('fs');
  path = require('path');
}

export interface MockDatabaseConfig {
  mockMode?: 'memory' | 'json' | 'indexeddb' | 'fake-indexeddb' | 'sqlite' | 'csv' | 'sql';
  jsonFilePath?: string;
  csvDir?: string;
  sqlDir?: string;
  sqliteFilePath?: string;
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

/**
 * Mock数据库客户端
 * 用于测试和开发环境
 * 支持多种 mock 数据源
 */
export class MockDatabaseClient extends BaseClient {
  private data: Record<string, Map<string, any>> = {};
  private mockConfig: Required<Pick<MockDatabaseConfig, 'mockMode' | 'jsonFilePath' | 'csvDir' | 'sqlDir' | 'autoSave' | 'sqliteFilePath'>>;
  private sqliteDb: any;

  constructor(private config: MockDatabaseConfig) {
    super();
    this.mockConfig = {
      mockMode: config.mockMode || configService.get('MOCK_DB_MODE') || 'memory',
      jsonFilePath: config.jsonFilePath || './mock-data.json',
      csvDir: config.csvDir || './mock-csv',
      sqlDir: config.sqlDir || './mock-sql',
      autoSave: config.autoSave ?? true,
      sqliteFilePath: config.sqliteFilePath || configService.get('MOCK_SQLITE_FILE') || ':memory:'
    };
    this.logger = lo('MockDatabaseClient');
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.debug('MockDatabaseClient already initialized');
      return;
    }
    this.logger.debug('Initializing MockDatabaseClient');
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
      this.initialized = true;
      this.logger.debug('MockDatabaseClient initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MockDatabaseClient', { error });
      throw createDatabaseError(
        DatabaseErrorCode.INITIALIZATION_ERROR,
        `Failed to initialize MockDatabaseClient: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  async close(): Promise<void> {
    this.data = {};
    this.initialized = false;
    this.logger.info('MockDatabaseClient closed');
  }

  async clear(): Promise<void> {
    this.data = {};
    this.logger.info('MockDatabaseClient cleared');
  }

  /**
   * 检查客户端是否已初始化
   */
  checkInitialized(): void {
    if (!this.initialized) {
      this.logger.error('MockDatabaseClient 未初始化');
      throw createDatabaseError(DatabaseErrorCode.CLIENT_NOT_INITIALIZED, 'MockDatabaseClient 未初始化');
    }
  }

  /**
   * 根据主键查询单条记录
   */
  async findById(tableName: string, id: string): Promise<any | null> {
    this.checkInitialized();
    const table = this.data[tableName];
    const item = table?.get(id) ?? null;
    this.logger.debug('findById', { tableName, id, found: !!item });
    return item;
  }

  /**
   * 查询所有记录，支持简单过滤
   */
  async findAll(tableName: string, filter?: Record<string, any>): Promise<any[]> {
    this.checkInitialized();
    const table = this.data[tableName];
    let items = Array.from(table?.values() ?? []);
    if (filter) {
      items = items.filter(item => Object.entries(filter).every(([k, v]) => item[k] === v));
    }
    this.logger.debug('findAll', { tableName, count: items.length });
    return items;
  }

  /**
   * 创建记录
   */
  async create(tableName: string, data: any): Promise<any> {
    this.checkInitialized();
    if (!this.data[tableName]) this.data[tableName] = new Map();
    const id = data.id || Math.random().toString(36).slice(2);
    const now = new Date().toISOString();
    const item = { ...data, id, createdAt: now, updatedAt: now };
    this.data[tableName].set(id, item);
    this.logger.info('create', { tableName, id });
    return item;
  }

  /**
   * 更新记录
   */
  async update(tableName: string, id: string, data: Partial<any>): Promise<void> {
    this.checkInitialized();
    const table = this.data[tableName];
    if (!table || !table.has(id)) {
      this.logger.warn('update: not found', { tableName, id });
      throw createDatabaseError(DatabaseErrorCode.NOT_FOUND, `Record not found: ${id}`);
    }
    const now = new Date().toISOString();
    const updated = { ...table.get(id), ...data, id, updatedAt: now };
    table.set(id, updated);
    this.logger.info('update', { tableName, id });
  }

  /**
   * 删除记录
   */
  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    const table = this.data[tableName];
    if (!table || !table.has(id)) {
      this.logger.warn('delete: not found', { tableName, id });
      throw createDatabaseError(DatabaseErrorCode.NOT_FOUND, `Record not found: ${id}`);
    }
    table.delete(id);
    this.logger.info('delete', { tableName, id });
  }

  /**
   * 批量操作
   */
  async batch(tableName: string, operations: BatchOperation<any>[]): Promise<void> {
    this.checkInitialized();
    for (const op of operations) {
      if (op.type === 'create') {
        await this.create(tableName, op.data);
      } else if (op.type === 'update') {
        await this.update(tableName, op.id!, op.data);
      } else if (op.type === 'delete') {
        await this.delete(tableName, op.id!);
      }
    }
    this.logger.info('batch', { tableName, count: operations.length });
  }

  /**
   * 统计记录数
   */
  async count(tableName: string, filter?: Partial<any>): Promise<number> {
    this.checkInitialized();
    const items = await this.findAll(tableName, filter);
    this.logger.debug('count', { tableName, count: items.length });
    return items.length;
  }

  /**
   * 查询接口，支持简单 where/orderBy/limit/offset
   */
  async query(tableName: string, options: QueryOptions): Promise<QueryResult<any>> {
    this.checkInitialized();
    let items = await this.findAll(tableName);
    if (options.where) {
      items = items.filter(item => Object.entries(options.where!).every(([k, v]) => item[k] === v));
    }
    if (options.orderBy) {
      const { field, direction } = options.orderBy;
      items.sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];
        if (aValue === bValue) return 0;
        const comparison = aValue < bValue ? -1 : 1;
        return direction === 'asc' ? comparison : -comparison;
      });
    }
    const total = items.length;
    let processed = items;
    if (options.limit !== undefined || options.offset !== undefined) {
      const start = options.offset || 0;
      const end = options.limit !== undefined ? start + options.limit : undefined;
      processed = processed.slice(start, end);
    }
    this.logger.debug('query', { tableName, total, returned: processed.length });
    return {
      items: processed,
      total,
      hasMore: total > ((options.offset || 0) + processed.length)
    };
  }

  /**
   * 事务相关（mock 环境直接记录日志即可）
   */
  async beginTransaction(): Promise<void> {
    this.checkInitialized();
    this.logger.info('Transaction started');
  }
  async commitTransaction(): Promise<void> {
    this.checkInitialized();
    this.logger.info('Transaction committed');
  }
  async rollbackTransaction(): Promise<void> {
    this.checkInitialized();
    this.logger.warn('Transaction rolled back');
  }

  private getTable(collection: string): Map<string, any> {
    if (!this.data[collection]) {
      this.data[collection] = new Map();
    }
    return this.data[collection];
  }

  private async loadFromJson(): Promise<void> {
    if (isBrowser) {
      this.mockConfig.mockMode = 'memory';
      return;
    }

    try {
      const filePath = this.mockConfig.jsonFilePath;
      if (!filePath) {
        throw createDatabaseError(
          DatabaseErrorCode.INITIALIZATION_ERROR,
          'JSON file path is required when mockMode is set to "json"',
          undefined
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
      throw createDatabaseError(
        DatabaseErrorCode.OPERATION_FAILED,
        `Failed to load data from JSON file: ${error instanceof Error ? error.message : String(error)}`,
        error
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
        throw createDatabaseError(
          DatabaseErrorCode.INITIALIZATION_ERROR,
          'JSON file path is required when mockMode is set to "json"',
          undefined
        );
      }

      const jsonData: Record<string, Record<string, any>> = {};
      for (const [collection, records] of Object.entries(this.data)) {
        jsonData[collection] = Object.fromEntries(records as Map<string, any>);
      }

      await fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    } catch (error) {
      this.logger.error('Failed to save data to JSON file', { error });
      throw createDatabaseError(
        DatabaseErrorCode.OPERATION_FAILED,
        `Failed to save data to JSON file: ${error instanceof Error ? error.message : String(error)}`,
        error
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
}