// 通用 SQLite 仓储基类，适用于所有实体
import { SQLiteClient } from '@/core/lib/db/clients/sqlite/sqlite-client';
import { BaseEntity, QueryResult } from '@/core/lib/db/types/database';

export abstract class BaseSQLiteRepository<T extends BaseEntity> {
  protected client: SQLiteClient;
  protected table: string;

  constructor(client: SQLiteClient, table: string) {
    this.client = client;
    this.table = table;
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.client.findById(this.table, id);
    return result as T || null;
  }

  async findAll(): Promise<T[]> {
    const result = await this.client.findAll(this.table);
    return result as T[];
  }

  async create(data: T): Promise<T> {
    return (await this.client.create(this.table, data)) as T;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.client.update(this.table, id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.client.delete(this.table, id);
    const found = await this.findById(id);
    return !found;
  }
}
