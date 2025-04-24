// 仓储通用与业务接口定义，统一全局复用

/**
 * BaseEntity 约束：所有仓储实体必须包含基础字段
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 标准分页结果类型
 */
export interface PageResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 标准批量操作结果类型
 */
export interface BatchResult<T> {
  success: boolean;
  results: T[];
  errors?: AppError[];
}

/**
 * 结构化异常类型
 */
export interface AppError {
  code: string; // 错误码
  type: 'network' | 'permission' | 'validation' | 'server' | 'unknown';
  message: string;
  cause?: any;
}

/**
 * 标准异步状态类型（用于 hooks 返回）
 */
export interface AsyncState<T, E = AppError> {
  loading: boolean;
  error?: E;
  empty: boolean;
  data?: T;
}

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
