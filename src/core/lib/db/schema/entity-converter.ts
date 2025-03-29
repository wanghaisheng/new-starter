import { TableSchema } from './types';
import { BaseEntity, CreateEntityData, UpdateEntityData, DatabaseRecord } from '../types/base-entity';

export class EntityConverter<T extends BaseEntity> {
  constructor(private readonly schema: TableSchema) {}

  /**
   * 将实体数据转换为数据库格式
   */
  toDatabase<D extends CreateEntityData<T> | UpdateEntityData<T>>(data: D): Omit<T, keyof BaseEntity> {
    const result: Record<string, any> = { ...data };
    
    // 遍历 schema 中定义的列
    for (const column of this.schema.columns) {
      const value = result[column.name];
      
      // 如果值存在，根据列类型进行转换
      if (value !== undefined) {
        switch (column.type) {
          case 'date':
            result[column.name] = value instanceof Date ? value.toISOString() : new Date(value).toISOString();
            break;
          case 'json':
            result[column.name] = typeof value === 'string' ? value : JSON.stringify(value);
            break;
          default:
            result[column.name] = value;
        }
      }
    }
    
    return result as Omit<T, keyof BaseEntity>;
  }

  /**
   * 将数据库数据转换为实体格式
   */
  fromDatabase(data: Record<string, any>): T {
    const result: Record<string, any> = { ...data };
    
    // 遍历 schema 中定义的列
    for (const column of this.schema.columns) {
      const value = result[column.name];
      
      // 如果值存在，根据列类型进行转换
      if (value !== undefined) {
        switch (column.type) {
          case 'date':
            result[column.name] = value instanceof Date ? value : new Date(value);
            break;
          case 'json':
            result[column.name] = typeof value === 'string' ? JSON.parse(value) : value;
            break;
          default:
            result[column.name] = value;
        }
      }
    }
    
    return result as T;
  }
} 