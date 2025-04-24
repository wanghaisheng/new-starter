import { BaseClient } from '../../clients/base-client';
import { IBaseRepository } from '../../types/repository';
import type { BaseEntity } from '../../types/base-entity';

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
  async findAll(filter?: Partial<T> & { _limit?: number; _offset?: number; _orderBy?: string }): Promise<T[]> {
    // 透传 filter 到 client.findAll，支持高级筛选
    const result = await this.client.findAll(this.table, filter);
    return result as T[];
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
  async query(query: Record<string, any>): Promise<T[]> {
    const result = await this.client.query(this.table, query);
    return (result && (result as any).rows) ? (result as any).rows as T[] : [];
  }
}
