import { BaseEntity, CreateEntityData, UpdateEntityData, DatabaseRecord } from '@/core/lib/db/types/base-entity';
import { TableSchema } from '../types/database';
import { ColumnType } from '../types/common';

/**
 * 类型安全的数据库读取后自动反序列化 JSON 字段
 * @param value 数据库字段
 * @param defaultValue 类型安全的默认值（如 []、{}、0、''）
 */
export function deserializeJsonField<T>(value: string | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined || value === 'null' || value === '') return defaultValue;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed !== typeof defaultValue) return defaultValue;
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 类型安全判断是否为 Date 对象
 */
export function isDate(val: any): val is Date {
  return typeof val === 'object' && val !== null && Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val.getTime());
}

/**
 * EntityConverter 支持类型安全的实体 <-> 数据库存储对象转换。
 * 
 * 泛型参数说明：
 *   T - 业务实体类型（如 Match, User）
 *   DB - 数据库存储类型（如 Match, User，或自定义 DbRecord 类型）
 * 
 * 推荐 DB 默认等于 T，除非有特殊需求。
 */
export class EntityConverter<T extends BaseEntity, DB = T> {
  constructor(private readonly schema: TableSchema) {}

  /**
   * 将实体数据转换为数据库格式
   * 保证返回类型与 DB 一致，类型安全
   */
  toDatabase(data: T | Partial<T>): DB {
    const result: Record<string, any> = {};
    for (const column of this.schema.columns) {
      let value = (data as any)[column.name];
      if (value === undefined) {
        result[column.name] = null;
        continue;
      }
      switch (column.type) {
        case ColumnType.DATETIME:
          result[column.name] = isDate(value) ? value.toISOString() : value;
          break;
        case ColumnType.JSON:
          result[column.name] = typeof value === 'string' ? value : JSON.stringify(value);
          break;
        case ColumnType.BOOLEAN:
          result[column.name] = value ? 1 : 0;
          break;
        default:
          result[column.name] = value;
      }
    }
    return result as DB;
  }

  /**
   * 将数据库格式数据转换为实体对象
   * 保证返回类型与 T 一致，类型安全
   */
  fromDatabase(record: DB): T {
    const entity: Record<string, any> = {};
    for (const column of this.schema.columns) {
      let value = (record as any)[column.name];
      if (value === undefined || value === null) {
        entity[column.name] = null;
        continue;
      }
      switch (column.type) {
        case ColumnType.DATETIME:
          entity[column.name] = typeof value === 'string' ? value : value?.toISOString?.() ?? value;
          break;
        case ColumnType.JSON:
          entity[column.name] = typeof value === 'string' ? deserializeJsonField(value, {}) : value;
          break;
        case ColumnType.BOOLEAN:
          entity[column.name] = value === 1 || value === true;
          break;
        default:
          entity[column.name] = value;
      }
    }
    return entity as T;
  }
}