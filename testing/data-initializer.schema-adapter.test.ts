import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchemaDataInitializerAdapter } from '@/core/services/business/data-initializer/adapters/schema-adapter';

// mock fs/promises
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    readFile: vi.fn(),
  },
}));

const fsPromises = require('fs').promises;

describe('SchemaDataInitializerAdapter', () => {
  let dbClient: any;

  beforeEach(() => {
    dbClient = {
      initSchema: vi.fn().mockResolvedValue(undefined),
      migrate: vi.fn().mockResolvedValue(undefined),
      execRawQuery: vi.fn().mockResolvedValue(undefined),
    };
    fsPromises.readdir.mockReset();
    fsPromises.readFile.mockReset();
  });

  it('should call dbClient.initSchema if present', async () => {
    const adapter = new SchemaDataInitializerAdapter({ dbClient });
    await adapter.initialize();
    expect(dbClient.initSchema).toHaveBeenCalled();
    expect(dbClient.migrate).not.toHaveBeenCalled();
    expect(dbClient.execRawQuery).not.toHaveBeenCalled();
  });

  it('should call dbClient.migrate if initSchema not present', async () => {
    delete dbClient.initSchema;
    const adapter = new SchemaDataInitializerAdapter({ dbClient });
    await adapter.initialize();
    expect(dbClient.migrate).toHaveBeenCalled();
    expect(dbClient.execRawQuery).not.toHaveBeenCalled();
  });

  it('should execute .sql files in sqlDir', async () => {
    const files = ['a.sql', 'b.sql', 'not_sql.txt'];
    const sqlContent = 'CREATE TABLE test (id INT);';
    dbClient = { execRawQuery: vi.fn().mockResolvedValue(undefined) };
    fsPromises.readdir.mockResolvedValue(files);
    fsPromises.readFile.mockResolvedValue(sqlContent);
    const adapter = new SchemaDataInitializerAdapter({ dbClient, sqlDir: '/mock/sql' });
    await adapter.initialize();
    expect(dbClient.execRawQuery).toHaveBeenCalledTimes(2);
    expect(dbClient.execRawQuery).toHaveBeenCalledWith(sqlContent);
  });

  it('should throw if no supported method found', async () => {
    dbClient = {};
    const adapter = new SchemaDataInitializerAdapter({ dbClient });
    await expect(adapter.initialize()).rejects.toThrow('dbClient 不支持 schema 初始化方法');
  });

  it('should throw if execRawQuery not present for sqlDir', async () => {
    dbClient = {};
    fsPromises.readdir.mockResolvedValue(['a.sql']);
    fsPromises.readFile.mockResolvedValue('SQL');
    const adapter = new SchemaDataInitializerAdapter({ dbClient, sqlDir: '/mock/sql' });
    await expect(adapter.initialize()).rejects.toThrow('dbClient 不支持 execRawQuery 方法');
  });
});
