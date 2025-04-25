// 通用 SQLite 仓储基类，适用于所有实体
import { KyselySQLiteClient } from '@/core/lib/db/clients/sqlite/kysely-sqlite-client';
import { BaseEntity } from '@/core/lib/db/types/database';

export abstract class BaseKyselySQLiteRepository<T extends BaseEntity> {
  protected client: KyselySQLiteClient<T>;
  protected table: string;

  constructor(client: KyselySQLiteClient<T>, table: string) {
    this.client = client;
    this.table = table;
  }

  async findById(id: string): Promise<T | null> {
    return this.client.findById(this.table, id);
  }

  async findAll(): Promise<T[]> {
    return this.client.findAll(this.table);
  }

  async create(data: T): Promise<T> {
    return this.client.create(this.table, data);
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
