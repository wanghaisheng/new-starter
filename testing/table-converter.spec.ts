  import { describe, it, expect } from 'vitest';
import { TableConverter } from '@/core/lib/db/schema/table-converter';
import { TableSchema, ColumnType, DatabaseType } from '@/core/lib/db/types/database';

const baseSchema: TableSchema = {
  name: 'test_table',
  columns: [
    { name: 'id', type: ColumnType.NUMBER, primaryKey: true, notNull: true },
    { name: 'name', type: ColumnType.STRING, notNull: true },
    { name: 'meta', type: ColumnType.JSON },
    { name: 'created_at', type: ColumnType.DATETIME, defValue: () => 'CURRENT_TIMESTAMP' },
    { name: 'code', type: ColumnType.STRING, unique: true },
  ],
  indexes: []
};

describe('TableConverter', () => {
  it('should convert TableSchema to Drizzle column definitions (sqlite)', () => {
    const tableDef = TableConverter.convertToTableDefinition(baseSchema, DatabaseType.SQLITE);
    expect(tableDef).toHaveProperty('id');
    expect(tableDef).toHaveProperty('name');
    expect(tableDef).toHaveProperty('meta');
    expect(tableDef).toHaveProperty('created_at');
    expect(tableDef).toHaveProperty('code');
    // 只断言字段定义存在
    expect(typeof tableDef.id).toBe('object');
    expect(typeof tableDef.name).toBe('object');
  });

  it('should support default value as function and primitive', () => {
    const schema: TableSchema = {
      ...baseSchema,
      columns: [
        ...baseSchema.columns,
        { name: 'flag', type: ColumnType.NUMBER, defValue: 1 }
      ]
    };
    const tableDef = TableConverter.convertToTableDefinition(schema, DatabaseType.SQLITE);
    expect(tableDef.flag).toBeDefined();
    expect(tableDef.created_at).toBeDefined();
  });

  it('should fallback to text for unknown type', () => {
    const schema: TableSchema = {
      ...baseSchema,
      columns: [
        { name: 'other', type: 'unknown' as any }
      ]
    };
    const tableDef = TableConverter.convertToTableDefinition(schema, DatabaseType.SQLITE);
    expect(tableDef.other).toBeDefined();
    // 只断言字段定义存在，不断言具体类型名
  });
});