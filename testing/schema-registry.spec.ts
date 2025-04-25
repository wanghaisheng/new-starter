import { describe, it, beforeEach, expect } from 'vitest';
import { schemaRegistry } from '@/core/lib/db/schema/index';
import { TableSchema, ColumnType, ColumnDefinition } from '@/core/lib/db/types/database';

const userSchema: TableSchema = {
  name: 'users',
  columns: [
    { name: 'id', type: ColumnType.TEXT, primaryKey: true } as ColumnDefinition,
    { name: 'name', type: ColumnType.TEXT } as ColumnDefinition,
    { name: 'email', type: ColumnType.TEXT } as ColumnDefinition,
    { name: 'onlyForOnline', type: ColumnType.TEXT, onlyFor: 'online' } as ColumnDefinition,
    { name: 'onlyForOffline', type: ColumnType.TEXT, onlyFor: 'offline' } as ColumnDefinition
  ],
  indexes: [
    { name: 'idx_email', columns: ['email'] },
    { name: 'idx_online', columns: ['onlyForOnline'], onlyFor: 'online' },
    { name: 'idx_offline', columns: ['onlyForOffline'], onlyFor: 'offline' }
  ]
};

beforeEach(() => {
  schemaRegistry.register(userSchema);
});

describe('schemaRegistry', () => {
  it('should register and retrieve schema by name', () => {
    const schema = schemaRegistry.getSchema('users');
    expect(schema).toBeDefined();
    expect(schema?.name).toBe('users');
  });

  it('should check if schema exists', () => {
    expect(schemaRegistry.hasSchema('users')).toBe(true);
    expect(schemaRegistry.hasSchema('not_exist')).toBe(false);
  });

  it('should get all schemas (default online)', () => {
    const schemas = schemaRegistry.getAllSchemas();
    expect(schemas.length).toBeGreaterThan(0);
    // onlyFor: 'offline' 字段不会出现在默认结果
    expect(schemas[0].columns.some(col => col.name === 'onlyForOffline')).toBe(false);
    // onlyFor: 'online' 字段会出现
    expect(schemas[0].columns.some(col => col.name === 'onlyForOnline')).toBe(true);
  });

  it('should get all offline schemas', () => {
    const schemas = schemaRegistry.getAllSchemas('offline');
    expect(schemas.length).toBeGreaterThan(0);
    // onlyFor: 'online' 字段不会出现在 offline 结果
    expect(schemas[0].columns.some(col => col.name === 'onlyForOnline')).toBe(false);
    // onlyFor: 'offline' 字段会出现
    expect(schemas[0].columns.some(col => col.name === 'onlyForOffline')).toBe(true);
  });

  it('should get all hybrid schemas', () => {
    const schemas = schemaRegistry.getAllSchemas('hybrid');
    expect(schemas.length).toBeGreaterThan(0);
    // hybrid 会包含没有 onlyFor 的字段
    expect(schemas[0].columns.some(col => !col.onlyFor)).toBe(true);
  });

  it('should filter indexes by target', () => {
    const online = schemaRegistry.getAllSchemas('online')[0];
    const offline = schemaRegistry.getAllSchemas('offline')[0];
    expect(online.indexes && online.indexes.some(idx => idx.name === 'idx_online')).toBe(true);
    expect(online.indexes && online.indexes.some(idx => idx.name === 'idx_offline')).toBe(false);
    expect(offline.indexes && offline.indexes.some(idx => idx.name === 'idx_online')).toBe(false);
    expect(offline.indexes && offline.indexes.some(idx => idx.name === 'idx_offline')).toBe(true);
  });

  it('should not overwrite schema with same name', () => {
    const newSchema: TableSchema = {
      name: 'users',
      columns: [{ name: 'id', type: ColumnType.TEXT, primaryKey: true } as ColumnDefinition],
      indexes: []
    };
    schemaRegistry.register(newSchema);
    // 仍然是原始 userSchema（不会被覆盖）
    const schema = schemaRegistry.getSchema('users');
    expect(schema?.columns.length).toBeGreaterThan(1);
  });

  it('should handle empty registry gracefully', () => {
    // 单例清空后测试
    schemaRegistry.clear();
    expect(schemaRegistry.getAllSchemas().length).toBe(0);
    expect(schemaRegistry.getSchema('none')).toBeUndefined();
    expect(schemaRegistry.hasSchema('none')).toBe(false);
  });

  it('should support multiple schema registrations', () => {
    const bookSchema: TableSchema = {
      name: 'books',
      columns: [
        { name: 'id', type: ColumnType.TEXT, primaryKey: true } as ColumnDefinition,
        { name: 'title', type: ColumnType.TEXT } as ColumnDefinition
      ],
      indexes: []
    };
    schemaRegistry.register(bookSchema);
    expect(schemaRegistry.getSchema('books')).toBeDefined();
    expect(schemaRegistry.getAllSchemas().some(s => s.name === 'books')).toBe(true);
  });

  it('should filter columns/indexes with onlyFor undefined for hybrid', () => {
    const hybridSchemas = schemaRegistry.getAllSchemas('hybrid');
    expect(hybridSchemas[0].columns.some(col => !col.onlyFor)).toBe(true);
    expect(hybridSchemas[0].indexes && hybridSchemas[0].indexes.some(idx => !idx.onlyFor)).toBe(true);
  });

  it('should not return columns/indexes for mismatched onlyFor', () => {
    const onlineSchemas = schemaRegistry.getAllSchemas('online');
    expect(onlineSchemas[0].columns.some(col => col.onlyFor === 'offline')).toBe(false);
    expect(onlineSchemas[0].indexes && onlineSchemas[0].indexes.some(idx => idx.onlyFor === 'offline')).toBe(false);
    const offlineSchemas = schemaRegistry.getAllSchemas('offline');
    expect(offlineSchemas[0].columns.some(col => col.onlyFor === 'online')).toBe(false);
    expect(offlineSchemas[0].indexes && offlineSchemas[0].indexes.some(idx => idx.onlyFor === 'online')).toBe(false);
  });

  it('should return deep copies of schemas', () => {
    const schemas = schemaRegistry.getAllSchemas();
    schemas[0].columns[0].name = 'changed';
    const original = schemaRegistry.getSchema('users');
    expect(original && original.columns[0].name).not.toBe('changed');
  });
});
