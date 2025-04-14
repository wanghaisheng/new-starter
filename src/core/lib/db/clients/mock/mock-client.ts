import { IDatabaseClient, DatabaseConfig } from '@/core/lib/db/interfaces';
import { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database.types';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { DatabaseError, DatabaseErrorCode } from '@/core/lib/db/errors/database-error';
import { Logger } from '@/core/lib/utils/logger';
import { config } from '@/core/lib/db/config';
import { logger } from '@/core/lib/logger';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Only import Node.js modules in non-browser environments
let fs: any;
let path: any;

if (!isBrowser) {
  fs = require('fs');
  path = require('path');
}

/**
 * Mock数据库客户端配置接口
 */
export interface MockDatabaseConfig extends DatabaseConfig {
  /**
   * 数据源模式: 'memory' | 'json' | 'indexeddb'
   * - memory: 使用内存中预定义的数据
   * - json: 从JSON文件加载数据
   * - indexeddb: 使用IndexedDB
   * @default 'memory'
   */
  mockMode?: 'memory' | 'json' | 'indexeddb';

  /**
   * JSON文件路径（当mockMode为'json'时使用）
   * 如果提供相对路径，将相对于当前工作目录解析
   */
  jsonFilePath?: string;

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
  private mockConfig: Required<Pick<MockDatabaseConfig, 'mockMode' | 'jsonFilePath' | 'autoSave'>>;
  private isInitialized: boolean = false;
  protected transactionActive: boolean = false;
  private logger: Logger;

  constructor(private config: MockDatabaseConfig) {
    this.mockConfig = {
      mockMode: config.mockMode || 'memory',
      jsonFilePath: config.jsonFilePath || './mock-data.json',
      autoSave: config.autoSave ?? true
    };
    this.logger = new Logger('MockDatabaseClient');
  }

  async connect(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    logger.info('Mock database connected');
  }

  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      await this.close();
    }
    logger.info('Mock database disconnected');
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
      } else {
        // 加载示例数据
        const exampleData = require('./example-data.json') as Record<string, any[]>;
        for (const [collection, records] of Object.entries(exampleData)) {
          const table = this.getTable(collection);
          for (const record of records) {
            table.set(record.id, record);
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
    
    // 如果没有查询条件，返回所有记录
    if (!query) {
      return {
        data: records,
        total: records.length,
        hasMore: false
      };
    }

    // 处理简单的字段匹配
    let filtered = records;
    if (typeof query === 'object') {
      if (query.filter && typeof query.filter === 'function') {
        // 处理 filter 函数
        filtered = records.filter(query.filter);
      } else if (query.where) {
        // 处理复杂的 where 条件
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
        // 处理简单的字段匹配
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
    
    // 应用排序
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
    
    // 应用分页
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
    
    // Mock client doesn't support raw queries, return empty array
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
      // In browser environment, we can't load from files
      // Just use memory mode instead
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

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`JSON file not found: ${filePath}. Using empty data.`);
        return;
      }

      // Read and parse JSON file
      const jsonData = await fs.promises.readFile(filePath, 'utf8');
      const data = JSON.parse(jsonData);

      // Convert plain objects to Maps
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
      // In browser environment, we can't save to files
      // Just log a warning
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

      // Convert Maps to plain objects for JSON serialization
      const jsonData: Record<string, Record<string, any>> = {};
      for (const [collection, records] of Object.entries(this.data)) {
        jsonData[collection] = Object.fromEntries(records as Map<string, any>);
      }

      // Write to JSON file
      await fs.promises.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
    } catch (error) {
      this.logger.error('Failed to save data to JSON file', { error });
      throw new DatabaseError(
        `Failed to save data to JSON file: ${error instanceof Error ? error.message : String(error)}`,
        DatabaseErrorCode.OPERATION_FAILED
      );
    }
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