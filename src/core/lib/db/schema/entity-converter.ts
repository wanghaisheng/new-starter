import { BaseEntity, CreateEntityData, UpdateEntityData, DatabaseRecord } from '@/core/lib/db/types/base-entity';

import { TableSchema, ColumnType } from '../types/database';

export class EntityConverter<T extends BaseEntity> {
  constructor(private readonly schema: TableSchema) {}

  /**
   * 将实体数据转换为数据库格式
   */
  toDatabase<D extends CreateEntityData<T> | UpdateEntityData<T>>(data: D): Omit<T, keyof BaseEntity> {
    const result: Record<string, any> = {};
    console.log('[EntityConverter.toDatabase] 输入数据:', JSON.stringify(data));
    // 只处理 schema.columns 中定义的字段
    for (const column of this.schema.columns) {
      let value = (data as any)[column.name];
      if (value === undefined) {
        result[column.name] = null;
        continue;
      }
      switch (column.type) {
        case ColumnType.DATETIME:
          result[column.name] = value instanceof Date ? value.toISOString() : value;
          break;
        case ColumnType.JSON:
          result[column.name] = typeof value === 'string' ? value : JSON.stringify(value);
          break;
        case ColumnType.BOOLEAN:
          // SQLite 只接受 1/0，强制转换
          result[column.name] = value ? 1 : 0;
          break;
        default:
          result[column.name] = value;
      }
    }
    // 打印所有字段类型和值
    console.log('[EntityConverter.toDatabase] 字段类型:', Object.entries(result).map(([k,v]) => [k, typeof v, v]));
    return result as Omit<T, keyof BaseEntity>;
  }

  /**
   * 将数据库数据转换为实体格式
   */
  fromDatabase(data: Record<string, any>): T {
    console.log('[EntityConverter.fromDatabase] 输入数据:', JSON.stringify(data));
    const result: Record<string, any> = { ...data };
    
    // 遍历 schema 中定义的列
    for (const column of this.schema.columns) {
      const value = result[column.name];
      
      // 如果值存在，根据列类型进行转换
      if (value !== undefined) {
        switch (column.type) {
          case ColumnType.DATETIME:
            result[column.name] = value instanceof Date ? value : new Date(value);
            break;
          case ColumnType.JSON:
            result[column.name] = typeof value === 'string' ? JSON.parse(value) : value;
            break;
          default:
            result[column.name] = value;
        }
      }
    }
    console.log('[EntityConverter.fromDatabase] 转换后:', JSON.stringify(result));
    return result as T;
  }
} 