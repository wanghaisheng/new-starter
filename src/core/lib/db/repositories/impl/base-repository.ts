import { BaseClient } from '../../clients/base-client';
import { IBaseRepository } from '../types/base-repository.types';
import type { BaseEntity } from '../../types/base-entity';
import type { QueryResult } from '../../types/database';
import type { SortDirection } from '../../types/common';
import { parseQueryOptions } from '../../types/database';
import { EntityConverter } from '@/core/lib/db/schema/entity-converter';

/**
 * 通用仓储基类，封装基础 CRUD 操作（可被具体实体仓储继承）
 * 支持类型安全的实体 <-> 数据库存储对象转换
 */
export class BaseRepository<T extends BaseEntity, DB = T> implements IBaseRepository<T> {
  protected client: BaseClient<DB>;
  protected table: string;
  protected converter: EntityConverter<T, DB>;

  constructor(client: BaseClient<DB>, table: string, converter: EntityConverter<T, DB>) {
    this.client = client;
    this.table = table;
    this.converter = converter;
  }

  /** 创建实体（类型安全转换） */
  async create(entity: T): Promise<T> {
    const dbRecord = this.converter.toDatabase(entity);
    const result = await this.client.create(this.table, dbRecord);
    return this.converter.fromDatabase(result);
  }

  /** 根据ID查找实体（类型安全转换） */
  async findById(id: string): Promise<T | null> {
    const result = await this.client.findById(this.table, id);
    return result ? this.converter.fromDatabase(result) : null;
  }

  /** 查询所有实体，支持条件筛选、分页、排序（类型安全转换） */
  async findAll(
    filter?: Partial<T>,
    options?: { limit?: number; offset?: number; orderBy?: string | { field: string; direction: SortDirection } }
  ): Promise<QueryResult<T>> {
    const queryOptions = parseQueryOptions({ where: filter, ...options });
    const result = await this.client.query(this.table, queryOptions);
    return {
      ...result,
      items: result.items.map(item => this.converter.fromDatabase(item)),
    };
  }

  /** 更新实体（类型安全转换） */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    const dbRecord = this.converter.toDatabase(data as T);
    await this.client.update(this.table, id, dbRecord);
    return this.findById(id);
  }

  /** 删除实体 */
  async delete(id: string): Promise<boolean> {
    await this.client.delete(this.table, id);
    return true;
  }

  /** 通用查询接口（可用于复杂条件，类型安全转换） */
  async query(
    filter?: Partial<T>,
    options?: { limit?: number; offset?: number; orderBy?: string | { field: string; direction: SortDirection } }
  ): Promise<QueryResult<T>> {
    const queryOptions = parseQueryOptions({ where: filter, ...options });
    const result = await this.client.query(this.table, queryOptions);
    return {
      ...result,
      items: result.items.map(item => this.converter.fromDatabase(item)),
    };
  }

  /** 批量创建实体（类型安全转换，默认串行实现，可被子类重写为批量操作） */
  async createMany?(entities: T[]): Promise<T[]> {
    const results: T[] = [];
    for (const entity of entities) {
      results.push(await this.create(entity));
    }
    return results;
  }

  /** 批量更新实体（类型安全转换，默认串行实现，可被子类重写为批量操作） */
  async updateMany?(ids: string[], updates: Partial<T>): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const updated = await this.update(id, updates);
      if (updated) count++;
    }
    return count;
  }

  /** 批量删除实体（类型安全转换，默认串行实现，可被子类重写为批量操作） */
  async deleteMany?(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const deleted = await this.delete(id);
      if (deleted) count++;
    }
    return count;
  }
}
