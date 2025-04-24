// 通用 IndexedDB 仓储基类，适用于所有实体
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { BaseEntity } from '@/core/lib/db/types/database';

export abstract class BaseIndexedDBRepository<T extends BaseEntity> {
  protected client: IndexedDBClient<T>;
  protected table: string;

  constructor(client: IndexedDBClient<T>, table: string) {
    this.client = client;
    this.table = table;
  }

  async findById(id: string): Promise<T | null> {
    // 直接调用泛型化 client 方法
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
