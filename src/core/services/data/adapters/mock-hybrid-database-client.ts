import { IDataService, DataServiceConfig } from '../types';
import { BaseDatabaseClient } from './base-database-client';
import { MockDatabaseClient, MockDatabaseConfig } from '@/core/lib/db/clients/mock/mock-client';
import { LoggerService } from '@/core/services/infrastructure/logger/service/logger-service';

/**
 * MockHybridDatabaseClient
 * 基于 MockDatabaseClient 的 mock adapter，支持多种 mock 后端（memory/json/fake-indexeddb）
 * 实现统一 IDataService 接口，便于工厂/注册表自动切换
 */
export class MockHybridDatabaseClient extends BaseDatabaseClient implements IDataService {
  private client: MockDatabaseClient;
  private config: MockDatabaseConfig;
  private logger = LoggerService.getInstance();

  constructor(config: Partial<MockDatabaseConfig>) {
    super(config as DataServiceConfig); // 类型断言，mock 环境安全
    // 兼容工厂 options.mock 只传部分字段的情况
    this.config = {
      name: config.name || 'mock',
      version: config.version || 1,
      engine: 'mock',
      tables: config.tables || {},
      mockMode: config.mockMode || 'memory',
      jsonFilePath: config.jsonFilePath,
      sqliteFilePath: config.sqliteFilePath,
      autoSave: config.autoSave ?? true,
      env: config.env || {
        environment: 'development', // DatabaseEnvironment
        enableOffline: true,
        enableHybrid: false
      },
      storage: config.storage || {
        online: {
          type: 'memory',
          connection: {} // DatabaseConnection: mock 可用空对象
        },
        offline: {
          type: 'memory',
          connection: {} // DatabaseConnection: mock 可用空对象
        }
      },
      sync: config.sync || {
        enabled: false,
        strategy: 'manual'
      },
      testData: config.testData || {
        loadOnStartup: false,
        source: 'example' // DemoDataSource: 'example' | 'dating'
      }
    };
    this.logger.info('[MockHybridDatabaseClient] 初始化，mockMode=' + (this.config.mockMode));
    this.client = new MockDatabaseClient(this.config);
  }

  async initialize(): Promise<void> {
    this.logger.info('[MockHybridDatabaseClient] initialize');
    await this.client.initialize();
  }

  async connect(): Promise<void> {
    this.logger.info('[MockHybridDatabaseClient] connect');
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    this.logger.info('[MockHybridDatabaseClient] disconnect');
    await this.client.disconnect();
  }

  async clear(): Promise<void> {
    this.logger.info('[MockHybridDatabaseClient] clear');
    await this.client.clear();
    this.cacheClear();
  }

  // ===================== IDataService & BaseDatabaseClient required methods =====================

  async findOne<T extends { id: string }>(table: string, id: string): Promise<T | null> {
    this.logger.debug(`[MockHybridDatabaseClient] findOne ${table} ${id}`);
    return this.client.findById(table, id);
  }

  async insert<T extends { id: string }>(table: string, data: Partial<T>): Promise<T> {
    this.logger.debug(`[MockHybridDatabaseClient] insert ${table}`);
    return this.client.create(table, data);
  }

  async update<T extends { id: string }>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    this.logger.debug(`[MockHybridDatabaseClient] update ${table} ${id}`);
    return this.client.update(table, id, data);
  }

  async delete(table: string, id: string): Promise<void> {
    this.logger.debug(`[MockHybridDatabaseClient] delete ${table} ${id}`);
    await this.client.delete(table, id); // ignore boolean return
  }

  async query<T>(table: string, options?: any): Promise<T[]> {
    this.logger.debug(`[MockHybridDatabaseClient] query ${table}`);
    // MockDatabaseClient.query returns QueryResult<T>, extract .data, 强制类型断言
    const result = await this.client.query(table, options);
    return result.data as T[];
  }

  async beginTransaction(): Promise<void> {
    this.logger.debug('[MockHybridDatabaseClient] beginTransaction');
    await this.client.beginTransaction();
  }

  async commitTransaction(): Promise<void> {
    this.logger.debug('[MockHybridDatabaseClient] commitTransaction');
    await this.client.commitTransaction();
  }

  async rollbackTransaction(): Promise<void> {
    this.logger.debug('[MockHybridDatabaseClient] rollbackTransaction');
    await this.client.rollbackTransaction();
  }

  async batch<T>(table: string, operations: Array<{ type: 'insert' | 'update' | 'delete'; data?: T | Partial<T>; id?: string; }>): Promise<void> {
    this.logger.debug(`[MockHybridDatabaseClient] batch ${table}`);
    // Map to the BatchOperation type expected by MockDatabaseClient
    const mapped = operations.map(op => {
      let type: 'add' | 'put' | 'delete';
      switch (op.type) {
        case 'insert': type = 'add'; break;
        case 'update': type = 'put'; break;
        case 'delete': type = 'delete'; break;
        default: type = op.type as any;
      }
      return { type, data: op.data, id: op.id };
    });
    // @ts-ignore: types may differ slightly
    await this.client.batch(table, mapped);
  }

  async executeRawQuery<T>(query: string, params?: any[]): Promise<T[]> {
    this.logger.debug('[MockHybridDatabaseClient] executeRawQuery');
    return this.client.executeRawQuery(query, params);
  }

  getType(): string {
    return 'mock';
  }

  isInitialized(): boolean {
    // @ts-ignore: isInitialized is private, but we expose for adapter
    return this.client.isInitialized === true || this.client.isInitialized?.();
  }

  getConfig(): any {
    return this.config;
  }

  // ===================== END required methods =====================
}
