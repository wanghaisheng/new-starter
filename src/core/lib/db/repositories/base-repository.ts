import { IBaseDatabaseClient, QueryOptions } from '../interfaces';
import { BatchOperation, QueryResult, BaseEntity } from '../types';

/**
 * 基础仓储抽象类
 * 提供通用的 CRUD 操作
 */
export abstract class BaseRepository<T extends BaseEntity> {
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
  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    return this.client.create<T>(this.tableName, data as T);
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
  async query(options: QueryOptions): Promise<QueryResult<T>> {
    return this.client.query<T>(this.tableName, options);
  }

  /**
   * 批量操作
   * @param operations 批量操作列表
   */
  async batch(operations: BatchOperation<T>[]): Promise<void> {
    await this.client.batch<T>(this.tableName, operations);
  }

  /**
   * 执行事务
   * @param callback 事务回调函数
   * @returns 事务执行结果
   */
  async transaction<R>(callback: (tx: IBaseDatabaseClient) => Promise<R>): Promise<R> {
    await this.client.beginTransaction();
    try {
      const result = await callback(this.client);
      await this.client.commitTransaction();
      return result;
    } catch (error) {
      await this.client.rollbackTransaction();
      throw error;
    }
  }

  /**
   * 执行原始查询
   * @param query SQL查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  async executeRawQuery<R>(query: string, params: any[] = []): Promise<R[]> {
    return this.client.executeRawQuery<R>(query, params);
  }
}