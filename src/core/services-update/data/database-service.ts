import { IDatabaseClient } from '@/core/lib/db/interfaces';
import { DatabaseConfig, TransactionOptions } from '@/core/lib/db/types/database.types';
import type { User } from '@/core/lib/db/types/user';
import type { TestType, TestResult } from '@/core/lib/db/types/test';
import type { DatabaseBatchOperation } from '@/core/lib/db/types';

/**
 * IDataService
 * 统一数据服务接口，支持用户、测试、数据库操作
 */
export interface IDataService {
  initialize(): Promise<void>;
  isInitialized(): boolean;

  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByPhone(phoneNumber: string): Promise<User | null>;
  createUser(data: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  getTestTypes(): Promise<TestType[]>;
  getTestType(id: string): Promise<TestType | null>;
  getUserTestResults(userId: string): Promise<TestResult[]>;
  getTestResult(userId: string, testId: string): Promise<TestResult | null>;
  saveTestResult(result: Partial<TestResult>): Promise<TestResult>;

  connect(config?: DatabaseConfig): Promise<void>;
  disconnect(): Promise<void>;
  clear(): Promise<void>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  batch<T>(tableName: string, operations: DatabaseBatchOperation[]): Promise<void>;
  executeRawQuery<T>(query: string, params?: any[]): Promise<T[]>;

  create<T>(collection: string, data: Partial<T>): Promise<T>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<T>;
  delete(collection: string, id: string): Promise<boolean>;
  findById<T>(collection: string, id: string): Promise<T | null>;
  findAll<T>(collection: string, filter?: Record<string, any>): Promise<T[]>;
  dispose(): Promise<void>;
  query<T>(collection: string, query: any): Promise<any>;
  findOne<T>(collection: string, id: string): Promise<T | null>;
  insert<T>(collection: string, data: Partial<T>): Promise<T>;
}

/**
 * DatabaseService
 * 统一数据库适配器（支持多后端，如SQLite/IndexedDB等）
 * 通过工厂或配置注入具体实现，业务层只依赖本服务
 */
export class DatabaseService implements IDataService {
  private client: IDatabaseClient;
  private connected = false;
  private initialized = false;
  private config?: DatabaseConfig;

  constructor(client: IDatabaseClient, config?: DatabaseConfig) {
    this.client = client;
    this.config = config;
  }

  async initialize(): Promise<void> {
    await this.client.initialize?.();
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // 用户相关 (stubs)
  async getUser(id: string): Promise<User | null> { throw new Error('Not implemented'); }
  async getUserByEmail(email: string): Promise<User | null> { throw new Error('Not implemented'); }
  async getUserByPhone(phoneNumber: string): Promise<User | null> { throw new Error('Not implemented'); }
  async createUser(data: Partial<User>): Promise<User> { throw new Error('Not implemented'); }
  async updateUser(id: string, updates: Partial<User>): Promise<User> { throw new Error('Not implemented'); }
  async deleteUser(id: string): Promise<void> { throw new Error('Not implemented'); }

  // 测试相关 (stubs)
  async getTestTypes(): Promise<TestType[]> { throw new Error('Not implemented'); }
  async getTestType(id: string): Promise<TestType | null> { throw new Error('Not implemented'); }
  async getUserTestResults(userId: string): Promise<TestResult[]> { throw new Error('Not implemented'); }
  async getTestResult(userId: string, testId: string): Promise<TestResult | null> { throw new Error('Not implemented'); }
  async saveTestResult(result: Partial<TestResult>): Promise<TestResult> { throw new Error('Not implemented'); }

  async connect(config?: DatabaseConfig): Promise<void> {
    await this.client.connect(config);
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
    this.connected = false;
  }

  async clear(): Promise<void> {
    await this.client.clear();
  }

  async beginTransaction(): Promise<void> {
    await this.client.beginTransaction();
  }

  async commitTransaction(): Promise<void> {
    await this.client.commitTransaction();
  }

  async rollbackTransaction(): Promise<void> {
    await this.client.rollbackTransaction();
  }

  async batch<T>(tableName: string, operations: DatabaseBatchOperation[]): Promise<void> {
    await this.client.batch?.(tableName, operations);
  }

  async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> {
    return this.client.executeRawQuery?.(query, params) ?? [];
  }

  async create<T>(collection: string, data: Partial<T>): Promise<T> {
    return this.client.create<T>(collection, data);
  }

  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    return this.client.update<T>(collection, id, data);
  }

  async delete(collection: string, id: string): Promise<boolean> {
    return this.client.delete(collection, id);
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    return this.client.findById<T>(collection, id);
  }

  async findAll<T>(collection: string, filter?: Record<string, any>): Promise<T[]> {
    return this.client.findAll<T>(collection, filter) as Promise<T[]>;
  }

  // --- Additional stubs for full IDataService compatibility ---
  async dispose(): Promise<void> { throw new Error('Not implemented'); }
  async query<T>(collection: string, query: any): Promise<any> { return this.client.query<T>(collection, query); }
  async findOne<T>(collection: string, id: string): Promise<T | null> { return this.client.findById<T>(collection, id); }
  async insert<T>(collection: string, data: Partial<T>): Promise<T> { throw new Error('Not implemented'); }

  getType(): string {
    return this.config?.engine || 'unknown';
  }

  getConfig(): DatabaseConfig | undefined {
    return this.config;
  }
}

// 说明：
// 1. DatabaseClient 需在 adapters 目录下实现（如 SqliteDatabaseClient、IndexedDBDatabaseClient 等），并实现 connect/CRUD/事务等方法。
// 2. DatabaseService 通过依赖注入获得具体 client 实例，实现多后端灵活切换。
// 3. 业务 data-service、offline-storage-service 等通过 DatabaseService 进行数据操作，保证分层解耦。
