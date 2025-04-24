/**
 * 通用基础仓储接口，所有实体仓储均应继承
 */
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  // 可扩展通用方法，如分页、批量操作等
}
