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
  data: string;
}

describe('IndexedDBClient Performance Tests', () => {
  let client: IndexedDBClient;
  const dbName = 'test.db';
  const tableName = 'test_table';

  const dbConfig: DatabaseConfig = {
    name: dbName,
    version: 1,
    engine: 'indexeddb' as DatabaseEngine,
    offline: {
      maxStorageSize: 1024 * 1024 * 100, // 100MB
      maxEntitiesPerTable: 100000,
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

  describe('大数据量操作性能', () => {
    it('should handle batch creation of 1000 entities within 1 second', async () => {
      const startTime = performance.now();
      const entities: TestEntity[] = Array(1000).fill(null).map((_, index) => ({
        id: `test-${index}`,
        name: `test-${index}`,
        value: index,
        data: `data-${index}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await client.transaction(async (trx) => {
        for (const entity of entities) {
          await client.create(tableName, entity);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // 应该在1秒内完成

      // 验证数据是否正确创建
      const result = await client.query<TestEntity>(tableName, {
        where: [{ field: 'value', operator: '>=', value: 0 }]
      });
      expect(result.length).toBe(1000);
    });

    it('should handle querying 10000 entities within 100ms', async () => {
      // 创建10000个测试实体
      const entities: TestEntity[] = Array(10000).fill(null).map((_, index) => ({
        id: `test-${index}`,
        name: `test-${index}`,
        value: index,
        data: `data-${index}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await client.transaction(async (trx) => {
        for (const entity of entities) {
          await client.create(tableName, entity);
        }
      });

      // 测试查询性能
      const startTime = performance.now();
      const result = await client.query<TestEntity>(tableName, {
        where: [{ field: 'value', operator: '>', value: 5000 }]
      });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      expect(result.length).toBe(5000); // 应该返回5000个结果
    });
  });

  describe('高并发操作性能', () => {
    it('should handle 10 concurrent transactions within 500ms', async () => {
      const startTime = performance.now();
      const transactions = Array(10).fill(null).map((_, index) => 
        client.transaction(async (trx) => {
          const entity: TestEntity = {
            id: `concurrent-${index}`,
            name: `test-${index}`,
            value: index,
            data: `data-${index}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await client.create(tableName, entity);
        })
      );

      await Promise.all(transactions);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // 应该在500ms内完成

      // 验证所有事务是否成功
      const result = await client.query<TestEntity>(tableName, {
        where: [{ field: 'id', operator: '>=', value: 'concurrent-0' }]
      });
      expect(result.length).toBe(10);
    });

    it('should handle concurrent reads and writes without data corruption', async () => {
      // 创建初始数据
      const initialEntity: TestEntity = {
        id: 'concurrent-test',
        name: 'test',
        value: 0,
        data: 'initial',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.create(tableName, initialEntity);

      // 模拟并发读写操作
      const readPromises = Array(5).fill(null).map(() =>
        client.findById<TestEntity>(tableName, 'concurrent-test')
      );

      const writePromises = Array(5).fill(null).map((_, index) =>
        client.transaction(async (trx) => {
          const entity = await client.findById<TestEntity>(tableName, 'concurrent-test');
          if (entity) {
            await client.update(tableName, entity.id, { value: entity.value + 1 } as Partial<TestEntity>);
          }
        })
      );

      await Promise.all([...readPromises, ...writePromises]);

      // 验证数据一致性
      const finalEntity = await client.findById<TestEntity>(tableName, 'concurrent-test');
      expect(finalEntity).toBeTruthy();
      expect(finalEntity?.value).toBe(5); // 应该增加了5次
    });
  });

  describe('内存使用监控', () => {
    it('should maintain stable memory usage during large operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 创建大量数据
      const entities: TestEntity[] = Array(10000).fill(null).map((_, index) => ({
        id: `memory-${index}`,
        name: `test-${index}`,
        value: index,
        data: `data-${index}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await client.transaction(async (trx) => {
        for (const entity of entities) {
          await client.create(tableName, entity);
        }
      });

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // 内存增长不应该超过100MB
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    it('should clean up memory after large operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 创建大量数据
      const entities: TestEntity[] = Array(10000).fill(null).map((_, index) => ({
        id: `cleanup-${index}`,
        name: `test-${index}`,
        value: index,
        data: `data-${index}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await client.transaction(async (trx) => {
        for (const entity of entities) {
          await client.create(tableName, entity);
        }
      });

      // 删除所有数据
      await client.clear();

      // 强制垃圾回收
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // 内存增长不应该超过10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
}); 