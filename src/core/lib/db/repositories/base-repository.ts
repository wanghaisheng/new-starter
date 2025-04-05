import { IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import { BaseEntity, SyncableBaseEntity } from '@/core/lib/db/types/base-entity';
import { SchemaRegistry } from '@/core/lib/db/schema/schema-registry';
import { SyncState, SyncPriority } from '@/core/lib/db/types/sync-flags';
import { QueryOptions, QueryResult, BatchOperation } from '@/core/lib/db/types/database.types';

/**
 * 基础仓储抽象类
 * 提供通用的 CRUD 操作
 */
export abstract class BaseRepository<T extends BaseEntity> {
  protected schemaRegistry: SchemaRegistry;

  constructor(
    protected client: IBaseDatabaseClient,
    protected tableName: string
  ) {
    this.schemaRegistry = SchemaRegistry.getInstance();
  }
  
  /**
   * 检查表是否配置为仅离线存储
   * 这将影响同步行为
   * @returns 如果表是离线专用返回true，否则返回false
   */
  protected isOfflineOnly(): boolean {
    const schema = this.schemaRegistry.getSchema(this.tableName);
    return !!schema?.syncConfig?.offlineOnly;
  }

  /**
   * 根据ID查找实体
   * @param id 实体ID
   * @returns 找到的实体或null
   */
  async findById(id: string): Promise<T | null> {
    return this.client.findById(this.tableName, id) as Promise<T | null>;
  }
  
  /**
   * 查找所有实体
   * @param filter 过滤条件
   * @returns 实体列表
   */
  async findAll(filter?: Record<string, any>): Promise<T[]> {
    // 修复: 处理QueryResult，获取数据部分
    const result = await this.client.findAll(this.tableName, filter);
    // 如果结果是QueryResult类型（有data属性），则返回data部分
    // 否则假定结果本身就是实体数组
    if (result && typeof result === 'object' && 'data' in result) {
      return result.data as T[];
    }
    return result as T[];
  }
  
  /**
   * 创建实体
   * @param data 实体数据
   * @returns 创建的实体
   */
  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    // 创建基础实体
    const entity = await this.client.create(this.tableName, data as T);
    
    // 检查并添加同步标记
    if (this.isOfflineOnly()) {
      // 如果是离线专用表，则标记为已同步状态，不需要实际同步
      return {
        ...entity,
        _sync: {
          syncState: SyncState.SYNCED,
          localModifiedAt: new Date(),
          syncPriority: SyncPriority.LOW,
        }
      } as unknown as T;
    }
    
    return entity as T;
  }
  
  /**
   * 更新实体
   * @param id 实体ID
   * @param data 更新数据
   */
  async update(id: string, data: Partial<T>): Promise<void> {
    // 如果是离线专用表，则可以添加同步元数据标记为已同步
    if (this.isOfflineOnly() && !('_sync' in data)) {
      await this.client.update(this.tableName, id, {
        ...data,
        _sync: {
          syncState: SyncState.SYNCED,
          localModifiedAt: new Date(),
          syncPriority: SyncPriority.LOW,
        }
      });
      return;
    }
    
    await this.client.update(this.tableName, id, data);
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
    return this.client.query(this.tableName, options) as Promise<QueryResult<T>>;
  }

  /**
   * 批量操作
   * @param operations 批量操作列表
   */
  async batch(operations: BatchOperation<T>[]): Promise<void> {
    await this.client.batch(this.tableName, operations as BatchOperation<BaseEntity>[]);
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