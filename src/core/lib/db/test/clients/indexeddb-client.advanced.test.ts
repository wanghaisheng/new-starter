import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexedDBClient } from '@db/clients/indexeddb/indexeddb-client';
import type { BaseEntity } from '@db/types/base-entity';
import type { DatabaseConfig, DatabaseEngine } from '@db/interfaces';

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

describe('IndexedDBClient Advanced Tests', () => {
  let client: IndexedDBClient;
  const dbName = 'test.db';
  const tableName = 'test_table';

  const dbConfig: DatabaseConfig = {
    name: dbName,
    version: 1,
    engine: 'indexeddb' as DatabaseEngine,
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

  describe('Performance Optimization', () => {
    it('should handle batch operations efficiently', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      await client.initialize();

      // 创建100个测试实体
      const entities: TestEntity[] = Array.from({ length: 100 }, (_, i) => ({
        id: `test-${i}`,
        name: `test-${i}`,
        value: i,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // 使用事务批量创建
      const startTime = performance.now();
      await client.transaction(async (tx) => {
        for (const entity of entities) {
          await client.create(tableName, entity);
        }
      });
      const endTime = performance.now();

      // 验证性能
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成

      // 验证数据
      const result = await client.query<TestEntity>(tableName, {});
      expect(result.length).toBe(100);
    });

    it('should optimize query performance with indexes', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      await client.initialize();

      // 创建测试数据
      const entities: TestEntity[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `test-${i}`,
        name: `test-${i}`,
        value: i,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // 使用事务批量创建
      await client.transaction(async (tx) => {
        for (const entity of entities) {
          await client.create(tableName, entity);
        }
      });

      // 使用索引查询
      const startTime = performance.now();
      const result = await client.query<TestEntity>(tableName, {
        where: {
          field: 'value',
          operator: '>',
          value: 500
        }
      });
      const endTime = performance.now();

      // 验证性能
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
      expect(result.length).toBe(500);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent transactions correctly', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      await client.initialize();

      // 创建初始数据
      const entity: TestEntity = {
        id: 'test-1',
        name: 'test',
        value: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.create(tableName, entity);

      // 模拟并发更新
      const updatePromises = Array.from({ length: 10 }, (_, i) => 
        client.update(tableName, 'test-1', {
          ...entity,
          value: entity.value + 1
        })
      );

      await Promise.all(updatePromises);

      // 验证最终结果
      const result = await client.findById<TestEntity>(tableName, 'test-1');
      expect(result?.value).toBe(110);
    });

    it('should handle concurrent reads and writes', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      await client.initialize();

      // 创建测试数据
      const entities: TestEntity[] = Array.from({ length: 100 }, (_, i) => ({
        id: `test-${i}`,
        name: `test-${i}`,
        value: i,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // 使用事务批量创建
      await client.transaction(async (tx) => {
        for (const entity of entities) {
          await client.create(tableName, entity);
        }
      });

      // 模拟并发读写操作
      const operations = [
        // 读取操作
        ...Array.from({ length: 5 }, () => 
          client.query<TestEntity>(tableName, {
            where: {
              field: 'value',
              operator: '>',
              value: 50
            }
          })
        ),
        // 写入操作
        ...Array.from({ length: 5 }, (_, i) => 
          client.create(tableName, {
            id: `new-${i}`,
            name: `new-${i}`,
            value: 1000 + i,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        )
      ];

      await Promise.all(operations);

      // 验证数据一致性
      const result = await client.query<TestEntity>(tableName, {});
      expect(result.length).toBe(105); // 100 + 5
    });
  });

  describe('Error Recovery', () => {
    it('should recover from transaction errors', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn().mockRejectedValueOnce(new Error('Transaction error')),
        close: vi.fn()
      };

      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      await client.initialize();

      // 创建测试数据
      const entity: TestEntity = {
        id: 'test-1',
        name: 'test',
        value: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 尝试创建实体（应该失败）
      await expect(client.create(tableName, entity)).rejects.toThrow('Transaction error');

      // 验证数据未被创建
      const result = await client.findById<TestEntity>(tableName, 'test-1');
      expect(result).toBeNull();
    });

    it('should handle database corruption recovery', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      // 模拟数据库损坏
      mockIndexedDB.open.mockRejectedValueOnce(new Error('Database corrupted'));
      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      // 尝试初始化（应该失败）
      await expect(client.initialize()).rejects.toThrow('Database corrupted');

      // 重新初始化（应该成功）
      await client.initialize();

      // 验证可以正常操作
      const entity: TestEntity = {
        id: 'test-1',
        name: 'test',
        value: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.create(tableName, entity);
      const result = await client.findById<TestEntity>(tableName, 'test-1');
      expect(result).toEqual(entity);
    });

    it('should handle storage quota exceeded recovery', async () => {
      const mockDB = {
        objectStoreNames: [tableName],
        transaction: vi.fn(),
        close: vi.fn()
      };

      // 模拟存储配额超限
      mockIndexedDB.open.mockRejectedValueOnce(new Error('QuotaExceededError'));
      mockIndexedDB.open.mockResolvedValueOnce(mockDB);

      // 尝试初始化（应该失败）
      await expect(client.initialize()).rejects.toThrow('QuotaExceededError');

      // 重新初始化（应该成功）
      await client.initialize();

      // 验证可以正常操作
      const entity: TestEntity = {
        id: 'test-1',
        name: 'test',
        value: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.create(tableName, entity);
      const result = await client.findById<TestEntity>(tableName, 'test-1');
      expect(result).toEqual(entity);
    });
  });
}); 