/**
 * 通用基础仓储接口，所有实体仓储均应继承
 */
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>, options?: { limit?: number; offset?: number; orderBy?: string }): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  createMany?(entities: T[]): Promise<T[]>;
  updateMany?(ids: string[], updates: Partial<T>): Promise<number>;
  deleteMany?(ids: string[]): Promise<number>;
  query?(filter?: Partial<T>, options?: { limit?: number; offset?: number; orderBy?: string }): Promise<T[]>;
}
