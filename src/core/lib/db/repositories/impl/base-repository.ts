import { BaseClient } from '../../clients/base-client';
import { IBaseRepository } from '../types/base-repository.types';
import type { BaseEntity } from '../../types/base-entity';
import type { QueryResult } from '../../types/database';
import type { SortDirection } from '../../types/common';
import { parseQueryOptions } from '../../types/database';

/**
 * 通用仓储基类，封装基础 CRUD 操作（可被具体实体仓储继承）
 */
export class BaseRepository<T extends BaseEntity> implements IBaseRepository<T> {
  protected client: BaseClient<T>;
  protected table: string;

  constructor(client: BaseClient<T>, table: string) {
    this.client = client;
    this.table = table;
  }

  /** 创建实体 */
  async create(entity: T): Promise<T> {
    const result = await this.client.create(this.table, entity);
    return result as T;
  }

  /** 根据ID查找实体 */
  async findById(id: string): Promise<T | null> {
    const result = await this.client.findById(this.table, id);
    return result ? (result as T) : null;
  }

  /** 查询所有实体，支持条件筛选、分页、排序 */
  async findAll(
    filter?: Partial<T>,
    options?: { limit?: number; offset?: number; orderBy?: string | { field: string; direction: SortDirection } }
  ): Promise<QueryResult<T>> {
    const queryOptions = parseQueryOptions({ where: filter, ...options });
    const result = await this.client.query(this.table, queryOptions);
    return result;
  }

  /** 更新实体 */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.client.update(this.table, id, data);
    return this.findById(id);
  }

  /** 删除实体 */
  async delete(id: string): Promise<boolean> {
    await this.client.delete(this.table, id);
    return true;
  }

  /** 通用查询接口（可用于复杂条件） */
  async query(
    filter?: Partial<T>,
    options?: { limit?: number; offset?: number; orderBy?: string | { field: string; direction: SortDirection } }
  ): Promise<QueryResult<T>> {
    const queryOptions = parseQueryOptions({ where: filter, ...options });
    const result = await this.client.query(this.table, queryOptions);
    return result;
  }

  /** 批量创建实体（默认串行实现，可被子类重写为批量操作） */
  async createMany?(entities: T[]): Promise<T[]> {
    const results: T[] = [];
    for (const entity of entities) {
      results.push(await this.create(entity));
    }
    return results;
  }

  /** 批量更新实体（默认串行实现，可被子类重写为批量操作） */
  async updateMany?(ids: string[], updates: Partial<T>): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const updated = await this.update(id, updates);
      if (updated) count++;
    }
    return count;
  }

  /** 批量删除实体（默认串行实现，可被子类重写为批量操作） */
  async deleteMany?(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const deleted = await this.delete(id);
      if (deleted) count++;
    }
    return count;
  }
}
