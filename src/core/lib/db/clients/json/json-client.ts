// import { IDatabaseClient, DatabaseConfig } from '@/core/lib/db/interfaces';
import { QueryOptions, QueryResult } from '@/core/lib/db/types/database';
import fs from 'fs/promises';

/**
 * JSON 文件数据库客户端
 */
export class JsonDatabaseClient implements IDatabaseClient {
  private data: Record<string, any[]> = {};
  private filePath: string;

  constructor(private config: DatabaseConfig) {
    this.filePath = config['jsonFilePath'] || './mock-data.json';
  }

  async connect(): Promise<void> {
    // JSON 文件存储无需显式连接
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    // JSON 文件存储无需显式断开
    return Promise.resolve();
  }

  async initialize(): Promise<void> { await this.loadFromFile(); }
  async close(): Promise<void> {}
  async clear(): Promise<void> { this.data = {}; await this.saveToFile(); }

  private async loadFromFile() {
    try {
      const content = await fs.readFile(this.filePath, 'utf8');
      this.data = JSON.parse(content);
    } catch (e) {
      this.data = {};
    }
  }

  private async saveToFile() {
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  async query(collection: string, query: QueryOptions): Promise<QueryResult<BaseEntity>> {
    const items = this.data[collection] ?? [];
    return { items } as QueryResult<BaseEntity>;
  }

  async findById(collection: string, id: string): Promise<BaseEntity | null> {
    return (this.data[collection] ?? []).find((item: BaseEntity) => item.id === id) ?? null;
  }

  async findAll(collection: string): Promise<BaseEntity[]> {
    return this.data[collection] ?? [];
  }

  async create(collection: string, data: BaseEntity): Promise<BaseEntity> {
    const now = new Date().toISOString();
    const entity: BaseEntity = {
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    if (!this.data[collection]) this.data[collection] = [];
    const id = entity.id || Math.random().toString(36).slice(2);
    const item = { ...entity, id };
    this.data[collection].push(item);
    await this.saveToFile();
    return item;
  }

  async update(collection: string, id: string, data: Partial<BaseEntity>): Promise<BaseEntity> {
    const now = new Date().toISOString();
    const idx = (this.data[collection] ?? []).findIndex((item: BaseEntity) => item.id === id);
    if (idx === -1) throw new Error('Not found');
    this.data[collection][idx] = {
      ...this.data[collection][idx],
      ...data,
      updatedAt: now,
    };
    await this.saveToFile();
    return this.data[collection][idx];
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const before = (this.data[collection] ?? []).length;
    this.data[collection] = (this.data[collection] ?? []).filter((item: BaseEntity) => item.id !== id);
    await this.saveToFile();
    return (this.data[collection].length < before);
  }
}
