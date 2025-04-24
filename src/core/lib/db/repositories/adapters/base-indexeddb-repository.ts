// 通用 IndexedDB 仓储基类，适用于所有实体
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { BaseEntity, QueryResult } from '@/core/lib/db/types/database';

export abstract class BaseIndexedDBRepository<T extends BaseEntity> {
  protected client: IndexedDBClient<T>;
  protected table: string;

  constructor(client: IndexedDBClient<T>, table: string) {
    this.client = client;
    this.table = table;
  }

  async findById(id: string): Promise<T | null> {
    const result: QueryResult<T> = await this.client.query(this.table, { where: { id } });
    return result.items[0] || null;
  }

  async findAll(): Promise<T[]> {
    const result: QueryResult<T> = await this.client.query(this.table, {});
    return result.items;
  }

  async create(data: T): Promise<T> {
    // IndexedDBClient 没有 insert，使用 create
    return this.client.create(this.table, data);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    // IndexedDBClient 的 update 返回 void，这里需先查找再更新
    await this.client.update(this.table, id, data);
    // 更新后重新查找并返回最新对象
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    // IndexedDBClient 的 delete 返回 void，这里补充 true/false
    await this.client.delete(this.table, id);
    // 若删除后查不到返回 true，否则 false
    const found = await this.findById(id);
    return !found;
  }
}
