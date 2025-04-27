// 此文件已废弃，所有实体-数据库转换请统一使用 src/core/lib/db/schema/entity-converter.ts
// 如有历史依赖，请迁移到 EntityConverter 工具类

import { BaseEntity, DatabaseRecord } from './base-entity';
import { TableSchema } from './database';
import { ColumnType } from './common';

/**
 * 提供在各种实体表示形式之间转换的函数
 *
 * @description
 * 这个模块提供函数用于在实体对象和数据库记录之间进行转换，
 * 自动处理类型转换、序列化和反序列化
 */

/**
 * 类型安全的数据库读取后自动反序列化 JSON 字段
 * @param value 数据库字段
 * @param defaultValue 类型安全的默认值（如 []、{}、0、''）
 */
export function deserializeJsonField<T>(value: string | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined || value === 'null' || value === '') return defaultValue;
  try {
    const parsed = JSON.parse(value);
    // 保证类型安全：如果解析结果类型与默认值类型不一致，返回默认值
    if (typeof parsed !== typeof defaultValue) return defaultValue;
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 类型安全判断是否为 Date 对象
 */
function isDate(val: any): val is Date {
  return typeof val === 'object' && val !== null && Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val.getTime());
}

/**
 * 通用实体转数据库记录（schema驱动，类型安全）
 * @param entity 业务实体对象
 * @param schema 表结构定义（TableSchema）
 */
export function entityToRecord<T extends BaseEntity>(entity: T, schema: TableSchema): DatabaseRecord {
  const record: Record<string, any> = {};
  for (const column of schema.columns) {
    let value = (entity as any)[column.name];
    if (value === undefined) {
      record[column.name] = null;
      continue;
    }
    switch (column.type) {
      case ColumnType.JSON:
        record[column.name] = typeof value === 'string' ? value : JSON.stringify(value);
        break;
      case ColumnType.BOOLEAN:
        // SQLite 只接受 1/0，强制转换
        record[column.name] = value ? 1 : 0;
        break;
      case ColumnType.DATETIME:
        record[column.name] = isDate(value) ? value.toISOString() : value;
        break;
      default:
        record[column.name] = value;
    }
  }
  return record as DatabaseRecord;
}

/**
 * 兼容历史单实体 toRecord（不推荐新用）
 */
export function userToRecord(user: any): DatabaseRecord {
  // 建议直接用 entityToRecord(user, userSchema)
  return entityToRecord(user, (globalThis as any).userSchema);
}