// 仓储通用与业务接口定义，统一全局复用

/**
 * BaseEntity 约束：所有仓储实体必须包含基础字段
 */


import { BaseEntity } from './base-entity';


/**
 * 通用仓储接口，所有实体仓储必须实现
 */
export interface IBaseRepository<T extends BaseEntity> {
  create(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  query(query: Record<string, any>): Promise<T[]>;
}

/**
 * 典型特殊仓储接口示例（以 Message 为例）
 */
export interface IMessageRepository extends IBaseRepository<any> {
  findThreadsByUser(userId: string): Promise<any[]>;
  markMultipleAsRead(messageIds: string[]): Promise<void>;
  // 可继续扩展聚合/统计等特殊方法
}

// 其他特殊仓储接口可按需扩展
