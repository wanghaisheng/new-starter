import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DataInitializerService } from '@/core/services/business/data-initializer/data-initializer.service';

// mock fs/promises
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    readFile: vi.fn(),
  },
}));

const fsPromises = require('fs').promises;

// 解决 Vitest doMock 的 require 缓存问题
function clearModuleCache(modulePath: string) {
  const resolved = require.resolve(modulePath);
  if (require.cache[resolved]) {
    delete require.cache[resolved];
  }
}

describe('DataInitializerService integration', () => {
  let dbClient: any;
  let tableData: Record<string, any[]>;

  beforeEach(() => {
    dbClient = {
      initSchema: vi.fn().mockResolvedValue(undefined),
      migrate: vi.fn().mockResolvedValue(undefined),
      execRawQuery: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined),
    };
    fsPromises.readdir.mockReset();
    fsPromises.readFile.mockReset();
    tableData = {
      users: [{ id: 1, name: 'Alice' }],
      posts: [{ id: 10, title: 'Hello' }],
    };
  });

  afterEach(() => {
    // 清理 Vitest mock
    vi.resetModules();
  });

  it('should initialize schema via ORM', async () => {
    const service = new DataInitializerService({ dbClient, importType: 'schema' });
    await service.initialize();
    expect(dbClient.initSchema).toHaveBeenCalled();
    expect(dbClient.migrate).not.toHaveBeenCalled();
    expect(dbClient.execRawQuery).not.toHaveBeenCalled();
  });

  it('should initialize schema via SQL scripts', async () => {
    const files = ['a.sql', 'b.sql'];
    const sqlContent = 'CREATE TABLE demo (id INT);';
    fsPromises.readdir.mockResolvedValue(files);
    fsPromises.readFile.mockResolvedValue(sqlContent);
    const service = new DataInitializerService({ dbClient, importType: 'schema', sqlDir: '/mock/sql' });
    await service.initialize();
    expect(dbClient.execRawQuery).toHaveBeenCalledTimes(2);
    expect(dbClient.execRawQuery).toHaveBeenCalledWith(sqlContent);
  });

  it('should initialize data via json', async () => {
    // mock require for json file
    const jsonFilePath = './mock-data.json';
    const jsonMock = tableData;
    vi.doMock(jsonFilePath, () => jsonMock, { virtual: true });
    clearModuleCache(jsonFilePath);
    const service = new DataInitializerService({ dbClient, importType: 'json', jsonFilePath });
    await service.initialize();
    expect(dbClient.clear).toHaveBeenCalledWith('users');
    expect(dbClient.clear).toHaveBeenCalledWith('posts');
    expect(dbClient.create).toHaveBeenCalledWith('users', { id: 1, name: 'Alice' });
    expect(dbClient.create).toHaveBeenCalledWith('posts', { id: 10, title: 'Hello' });
  });

  it('should initialize data via memory', async () => {
    // mock memory adapter数据
    const memoryModule = '@/core/lib/db/data';
    vi.doMock(memoryModule, () => ({ users: [{ id: 2 }] }), { virtual: true });
    clearModuleCache(memoryModule);
    const service = new DataInitializerService({ dbClient, importType: 'memory' });
    await service.initialize();
    expect(dbClient.clear).toHaveBeenCalledWith('users');
    expect(dbClient.create).toHaveBeenCalledWith('users', { id: 2 });
  });

  it('should initialize data via sql', async () => {
    const files = ['init.sql'];
    const sqlContent = 'INSERT INTO demo VALUES (1);';
    fsPromises.readdir.mockResolvedValue(files);
    fsPromises.readFile.mockResolvedValue(sqlContent);
    const service = new DataInitializerService({ dbClient, importType: 'sql', sqlDir: '/mock/sql' });
    await service.initialize();
    expect(dbClient.execRawQuery).toHaveBeenCalledWith(sqlContent);
  });
});
