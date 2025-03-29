import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteClient } from '../../../../clients/capacitor-sqlite/sqlite-client';
import { BaseEntity } from '../../../../types/base-entity';
import { QueryOptions } from '../../../../types/database.types';

interface TestEntity extends BaseEntity {
  name: string;
  age: number;
  email: string;
}

describe('SQLiteClient Performance', () => {
  let client: SQLiteClient;
  const testConfig = {
    name: 'test-db',
    version: 1
  };

  beforeEach(async () => {
    client = new SQLiteClient(testConfig);
    await client.initialize();
  });

  afterEach(async () => {
    await client.clear();
    await client.close();
  });

  describe('Write Performance', () => {
    it('should handle single record write efficiently', async () => {
      const startTime = performance.now();
      const testData: TestEntity = {
        id: '1',
        name: 'Test User',
        age: 25,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.create('test_table', testData);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // 期望写入时间小于 10ms
    });

    it('should handle batch write efficiently', async () => {
      const startTime = performance.now();
      const testData: TestEntity[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Test User ${i + 1}`,
        age: 25 + i,
        email: `test${i + 1}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      for (const data of testData) {
        await client.create('test_table', data);
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 期望批量写入时间小于 100ms
    });
  });

  describe('Read Performance', () => {
    beforeEach(async () => {
      // 准备测试数据
      const testData: TestEntity[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Test User ${i + 1}`,
        age: 25 + i,
        email: `test${i + 1}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      for (const data of testData) {
        await client.create('test_table', data);
      }
    });

    it('should handle single record query efficiently', async () => {
      const startTime = performance.now();
      await client.findById<TestEntity>('test_table', '1');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5); // 期望单条查询时间小于 5ms
    });

    it('should handle batch query efficiently', async () => {
      const startTime = performance.now();
      const options: QueryOptions = {
        limit: 100,
        offset: 0
      };
      await client.query<TestEntity>('test_table', options);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // 期望批量查询时间小于 50ms
    });

    it('should handle sorting query efficiently', async () => {
      const startTime = performance.now();
      const options: QueryOptions = {
        orderBy: ['age', 'DESC'],
        limit: 100
      };
      await client.query<TestEntity>('test_table', options);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // 期望排序查询时间小于 50ms
    });
  });

  describe('Concurrent Performance', () => {
    it('should handle concurrent writes efficiently', async () => {
      const startTime = performance.now();
      const promises = Array.from({ length: 100 }, (_, i) => {
        const testData: TestEntity = {
          id: `${i + 1}`,
          name: `Test User ${i + 1}`,
          age: 25 + i,
          email: `test${i + 1}@example.com`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return client.create('test_table', testData);
      });

      await Promise.all(promises);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // 期望并发写入时间小于 200ms
    });

    it('should handle concurrent queries efficiently', async () => {
      // 准备测试数据
      const testData: TestEntity[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Test User ${i + 1}`,
        age: 25 + i,
        email: `test${i + 1}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      for (const data of testData) {
        await client.create('test_table', data);
      }

      const startTime = performance.now();
      const promises = Array.from({ length: 10 }, () => {
        const options: QueryOptions = {
          limit: 100,
          offset: Math.floor(Math.random() * 900)
        };
        return client.query<TestEntity>('test_table', options);
      });

      await Promise.all(promises);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // 期望并发查询时间小于 100ms
    });
  });

  describe('Memory Usage', () => {
    it('should handle large data efficiently', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // 创建大量数据
      const testData: TestEntity[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Test User ${i + 1}`,
        age: 25 + i,
        email: `test${i + 1}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      for (const data of testData) {
        await client.create('test_table', data);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 期望内存增加小于 100MB
    });
  });
}); 