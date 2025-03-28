import { IBaseDatabaseClient } from '../interfaces';

/**
 * 基础仓储抽象类
 * 提供通用的 CRUD 操作
 */
export abstract class BaseRepository<T extends { id: string }> {
  constructor(
    protected client: IBaseDatabaseClient,
    protected tableName: string
  ) {}
  
  /**
   * 根据ID查找实体
   * @param id 实体ID
   * @returns 找到的实体或null
   */
  async findById(id: string): Promise<T | null> {
    return this.client.findById<T>(this.tableName, id);
  }
  
  /**
   * 查找所有实体
   * @param filter 过滤条件
   * @returns 实体列表
   */
  async findAll(filter?: Record<string, any>): Promise<T[]> {
    return this.client.findAll<T>(this.tableName, filter);
  }
  
  /**
   * 创建实体
   * @param data 实体数据
   * @returns 创建的实体
   */
  async create(data: T): Promise<T> {
    return this.client.create<T>(this.tableName, data);
  }
  
  /**
   * 更新实体
   * @param id 实体ID
   * @param data 要更新的数据
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    await this.client.update<T>(this.tableName, id, data);
  }
  
  /**
   * 删除实体
   * @param id 实体ID
   */
  async delete(id: string): Promise<void> {
    await this.client.delete(this.tableName, id);
  }
  
  /**
   * 高级查询
   * @param options 查询选项
   * @returns 查询结果
   */
  async query(options: {
    select?: string[];
    where?: Record<string, any>;
    orderBy?: string | string[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    return this.client.query<T>(this.tableName, options);
  }
}