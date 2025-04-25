/**
 * 通用类型守卫与字段归一工具
 * 支持日期、布尔、JSON 等字段类型的自动归一和校验
 * 可被各仓储实现复用
 */
import { TableSchema } from '@/core/lib/db/types/database';
import { ColumnType } from '@/core/lib/db/types/common';

export class TypeGuardHelper {
  /**
   * 归一化输入对象的所有字段类型（如 Date->string, boolean->0/1, JSON->string）
   * @param data 输入对象
   * @param schema 对应表的 TableSchema
   */
  static normalizeInput<T extends Record<string, any>>(data: T, schema: TableSchema): T {
    const normalized: any = { ...data };
    for (const col of schema.columns) {
      const val = normalized[col.name];
      if (val === undefined || val === null) continue;
      let typeStr = typeof col.type === 'string' ? col.type :
        (typeof col.type === 'number'
          ? (col.type === ColumnType.BOOLEAN ? 'boolean'
            : col.type === ColumnType.DATETIME ? 'datetime'
            : col.type === ColumnType.DATE ? 'date'
            : col.type === ColumnType.JSON ? 'json' : '')
          : '');
      if (typeStr === 'boolean') {
        normalized[col.name] = val === true || val === 1 ? 1 : 0;
      } else if (typeStr === 'datetime' || typeStr === 'date') {
        if (val instanceof Date) {
          normalized[col.name] = typeStr === 'date' ? val.toISOString().slice(0, 10) : val.toISOString();
        }
      } else if (typeStr === 'json') {
        if (typeof val !== 'string') {
          normalized[col.name] = JSON.stringify(val);
        }
      }
    }
    return normalized;
  }

  /**
   * 校验对象的所有字段类型（如 birthDate 必须为 string, isActive 必须为 boolean/0/1）
   * 可扩展更多类型校验
   */
  static validateInput<T extends Record<string, any>>(data: T, schema: TableSchema): void {
    for (const col of schema.columns) {
      const val = data[col.name];
      if (val === undefined || val === null) continue;
      let typeStr = typeof col.type === 'string' ? col.type :
        (typeof col.type === 'number'
          ? (col.type === ColumnType.BOOLEAN ? 'boolean'
            : col.type === ColumnType.DATETIME ? 'datetime'
            : col.type === ColumnType.DATE ? 'date'
            : col.type === ColumnType.JSON ? 'json' : '')
          : '');
      if (typeStr === 'boolean' && !(typeof val === 'boolean' || val === 0 || val === 1)) {
        throw new TypeError(`Field ${col.name} must be boolean/0/1, got: ${val}`);
      }
      if ((typeStr === 'date' || typeStr === 'datetime') && typeof val !== 'string') {
        throw new TypeError(`Field ${col.name} must be string (ISO date), got: ${val}`);
      }
      if (typeStr === 'json' && typeof val !== 'string' && typeof val !== 'object') {
        throw new TypeError(`Field ${col.name} must be object or stringified JSON, got: ${val}`);
      }
    }
  }
}
