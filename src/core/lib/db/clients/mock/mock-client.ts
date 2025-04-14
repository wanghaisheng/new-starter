import { IDatabaseClient, DatabaseConfig } from '@/core/lib/db/interfaces';
import { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database.types';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { DatabaseError, DatabaseErrorCode } from '@/core/lib/db/errors/database-error';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@/core/lib/utils/logger';
import { config } from '@/core/lib/db/config';

/**
 * Mock数据库客户端配置接口
 */
export interface MockDatabaseConfig extends DatabaseConfig {
  /**
   * 数据源模式: 'memory' | 'json'
   * - memory: 使用内存中预定义的数据
   * - json: 从JSON文件加载数据
   * @default 'memory'
   */
  mockMode?: 'memory' | 'json';

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
}

/**
 * 模拟数据库客户端
 * 用于测试和开发环境
 * 支持内存模式和JSON文件模式
 */
export class MockDatabaseClient implements IDatabaseClient {
  private data: { [key: string]: Map<string, any> } = {};
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
  }

  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      await this.close();
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.debug('Initializing mock database client');
    
    if (this.mockConfig.mockMode === 'json') {
      await this.loadFromJson();
    }
    
    this.isInitialized = true;
    this.logger.debug('Mock database client initialized');
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

  async query<T extends BaseEntity>(collection: string, options: QueryOptions): Promise<QueryResult<T>> {
    this.validateInitialized();
    this.logger.debug(`Querying ${collection}`, options);
    
    const table = this.getTable(collection);
    const records = Array.from(table.values()) as T[];
    
    // Apply basic filtering if where clause is provided in options
    let filtered = records;
    if (options?.where) {
      filtered = records.filter(record => {
        if (options.where && '$and' in options.where) {
          return (options.where.$and || []).every(condition => 
            this.matchesCondition(record, condition)
          );
        } else if (options.where && '$or' in options.where) {
          return (options.where.$or || []).some(condition => 
            this.matchesCondition(record, condition)
          );
        } else if (options.where) {
          return this.matchesCondition(record, options.where);
        }
        return true;
      });
    }
    
    // Apply sorting if orderBy is provided
    if (options.orderBy) {
      const { field, direction } = options.orderBy;
      filtered.sort((a, b) => {
        const aValue = (a as Record<string, any>)[field];
        const bValue = (b as Record<string, any>)[field];
        return direction === 'asc' ? 
          (aValue > bValue ? 1 : -1) :
          (aValue < bValue ? 1 : -1);
      });
    }
    
    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 10;
    const paginatedRecords = filtered.slice(offset, offset + limit);
    
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

  async findById<T extends BaseEntity>(collection: string, id: string): Promise<T | null> {
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

  async create<T extends BaseEntity>(collection: string, data: Partial<T>): Promise<T> {
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

  async update<T extends BaseEntity>(collection: string, id: string, data: Partial<T>): Promise<T> {
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
    try {
      const exists = await fs.promises.access(this.mockConfig.jsonFilePath)
        .then(() => true)
        .catch(() => false);
      
      if (exists) {
        const jsonData = await fs.promises.readFile(this.mockConfig.jsonFilePath, { encoding: 'utf8' });
        const data = JSON.parse(jsonData);
        Object.entries(data).forEach(([collection, records]) => {
          this.data[collection] = new Map(Object.entries(records as Record<string, any>));
        });
      }
    } catch (error) {
      this.logger.error('Failed to load mock data from JSON file', { error });
      throw new DatabaseError(
        'Failed to load mock data',
        DatabaseErrorCode.OPERATION_FAILED
      );
    }
  }

  private async saveToJson(): Promise<void> {
    try {
      const data = Object.fromEntries(
        Object.entries(this.data).map(([collection, records]) => [
          collection,
          Object.fromEntries(records as Map<string, any>)
        ])
      );
      const jsonData = JSON.stringify(data, null, 2);
      await fs.promises.writeFile(this.mockConfig.jsonFilePath, jsonData, { encoding: 'utf8' });
    } catch (error) {
      this.logger.error('Failed to save mock data to JSON file', { error });
      throw new DatabaseError(
        'Failed to save mock data',
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