import { IDatabaseClient, DatabaseConfig } from '@/core/lib/db/interfaces';
import { QueryOptions, QueryResult } from '@/core/lib/db/types/database.types';
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
    await this.loadFromFile();
  }
  async disconnect(): Promise<void> {}
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

  async query<T>(collection: string, query: QueryOptions): Promise<QueryResult<T>> {
    const items = this.data[collection] ?? [];
    return { items } as QueryResult<T>;
  }
  async findById<T>(collection: string, id: string): Promise<T | null> {
    return (this.data[collection] ?? []).find((item: any) => item.id === id) ?? null;
  }
  async findAll<T>(collection: string): Promise<T[]> {
    return this.data[collection] ?? [];
  }
  async create<T>(collection: string, data: Partial<T>): Promise<T> {
    if (!this.data[collection]) this.data[collection] = [];
    const id = (data as any).id || Math.random().toString(36).slice(2);
    const item = { ...data, id };
    this.data[collection].push(item);
    await this.saveToFile();
    return item as T;
  }
  async update<T>(collection: string, id: string, data: Partial<T>): Promise<T> {
    const idx = (this.data[collection] ?? []).findIndex((item: any) => item.id === id);
    if (idx === -1) throw new Error('Not found');
    this.data[collection][idx] = { ...this.data[collection][idx], ...data };
    await this.saveToFile();
    return this.data[collection][idx];
  }
  async delete(collection: string, id: string): Promise<boolean> {
    const before = (this.data[collection] ?? []).length;
    this.data[collection] = (this.data[collection] ?? []).filter((item: any) => item.id !== id);
    await this.saveToFile();
    return (this.data[collection].length < before);
  }
}
