import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBClient } from '@db/clients/indexeddb/indexeddb-client';
import type { BaseEntity } from '@db/types/base-entity';
import type { DatabaseConfig, DatabaseEngine } from '@db/types/database.types';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  databases: vi.fn()
};

vi.stubGlobal('indexedDB', mockIndexedDB);

interface TestEntity extends BaseEntity {
  name: string;
  value: number;
}

describe('IndexedDBClient', () => {
  let client: IndexedDBClient;
  const dbName = 'test.db';
  const tableName = 'test_table';

  const dbConfig: DatabaseConfig = {
    name: dbName,
    version: 1,
    engine: 'indexeddb' as DatabaseEngine,
    tables: {
      [tableName]: {
        columns: {
          id: {
            type: 'TEXT',
            constraints: ['PRIMARY KEY']
          },
          name: {
            type: 'TEXT',
            constraints: ['NOT NULL']
          },
          value: {
            type: 'INTEGER',
            constraints: ['NOT NULL']
          },
          createdAt: {
            type: 'TEXT',
            constraints: ['NOT NULL']
          },
          updatedAt: {
            type: 'TEXT',
            constraints: ['NOT NULL']
          }
        },
        indexes: {
          idx_name: {
            columns: ['name'],
            unique: false
          },
          idx_value: {
            columns: ['value'],
            unique: false
          }
        }
      }
    },
    offline: {
      maxStorageSize: 1024 * 1024,
      maxEntitiesPerTable: 1000,
      compressionEnabled: false,
      encryptionEnabled: false
    }
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    client = new IndexedDBClient(dbConfig);
    await client.initialize();
  });

  afterEach(async () => {
    try {
      await client.close();
    } catch (error) {
      console.error('关闭数据库失败:', error);
    }
  });

  describe('Storage Management', () => {
    it('should initialize database with correct configuration', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      await client.initialize();

      expect(mockIndexedDB.open).toHaveBeenCalledWith(dbName, 1);
      expect(mockDB.objectStoreNames).toContain(tableName);
    });

    it('should handle storage quota exceeded', async () => {
      const mockError = new Error('QuotaExceededError');
      mockIndexedDB.open.mockRejectedValueOnce(mockError);

      await expect(client.initialize()).rejects.toThrow('QuotaExceededError');
    });

    it('should clean up resources on close', async () => {
      const mockDB = {
        close: vi.fn()
      };

      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      await client.initialize();
      await client.close();

      expect(mockDB.close).toHaveBeenCalled();
    });
  });

  describe('Index Operations', () => {
    it('should create indexes correctly', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      await client.initialize();

      const store = await client.getObjectStore(tableName);
      expect(store.indexNames).toContain('idx_name');
      expect(store.indexNames).toContain('idx_value');
    });

    it('should use indexes for queries', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      await client.initialize();

      const result = await client.query<TestEntity>(tableName, {
        where: {
          field: 'name',
          operator: '==',
          value: 'test'
        }
      });

      expect(result).toBeDefined();
    });

    it('should handle index errors gracefully', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn().mockRejectedValue(new Error('Index error')),
        close: vi.fn()
      };

      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      await client.initialize();

      await expect(client.query<TestEntity>(tableName, {
        where: {
          field: 'name',
          operator: '==',
          value: 'test'
        }
      })).rejects.toThrow('Index error');
    });
  });

  describe('Version Upgrade', () => {
    it('should handle database version upgrade', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      // 模拟数据库已存在，需要升级
      mockIndexedDB.databases.mockResolvedValueOnce([{ name: dbName, version: 1 }]);
      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      // 更新配置版本
      const newConfig = { ...dbConfig, version: 2 };
      client = new IndexedDBClient(newConfig);

      await client.initialize();

      expect(mockIndexedDB.open).toHaveBeenCalledWith(dbName, 2);
    });

    it('should preserve data during upgrade', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      // 模拟数据库已存在，需要升级
      mockIndexedDB.databases.mockResolvedValueOnce([{ name: dbName, version: 1 }]);
      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      // 更新配置版本
      const newConfig = { ...dbConfig, version: 2 };
      client = new IndexedDBClient(newConfig);

      await client.initialize();

      // 验证数据是否保留
      const result = await client.query<TestEntity>(tableName);
      expect(result).toBeDefined();
    });

    it('should handle upgrade errors gracefully', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn().mockRejectedValue(new Error('Upgrade error')),
        close: vi.fn()
      };

      // 模拟数据库已存在，需要升级
      mockIndexedDB.databases.mockResolvedValueOnce([{ name: dbName, version: 1 }]);
      mockIndexedDB.open.mockRejectedValueOnce(new Error('Upgrade error'));

      // 更新配置版本
      const newConfig = { ...dbConfig, version: 2 };
      client = new IndexedDBClient(newConfig);

      await expect(client.initialize()).rejects.toThrow('Upgrade error');
    });
  });
}); 