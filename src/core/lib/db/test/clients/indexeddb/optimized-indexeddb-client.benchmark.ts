import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OptimizedIndexedDBClient } from '../../../../clients/indexeddb/optimized-indexeddb-client';
import { BaseEntity } from '../../../../types/base-entity';
import { QueryOptions } from '../../../../types/database.types';

interface TestEntity extends BaseEntity {
  name: string;
  age: number;
  email: string;
  data: string;
}

describe('OptimizedIndexedDBClient 性能基准测试', () => {
  let client: OptimizedIndexedDBClient;
  const TEST_DB_NAME = 'benchmark-db';
  const TEST_STORE_NAME = 'benchmark-store';
  const TEST_DATA_SIZE = 10000;

  beforeEach(async () => {
    client = new OptimizedIndexedDBClient({
      name: TEST_DB_NAME,
      version: 1
    });
    await client.initialize();
  });

  afterEach(async () => {
    await client.clear();
    await client.close();
  });

  describe('写入性能', () => {
    it('单条记录写入性能', async () => {
      const entity: Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test User',
        age: 25,
        email: 'test@example.com',
        data: 'x'.repeat(1000) // 1KB 数据
      };

      const start = performance.now();
      await client.create<TestEntity>(TEST_STORE_NAME, entity);
      const end = performance.now();

      console.log(`单条记录写入时间: ${end - start}ms`);
      expect(end - start).toBeLessThan(10); // 期望小于 10ms
    });

    it('批量写入性能', async () => {
      const entities: Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt'>[] = Array.from(
        { length: 100 },
        (_, i) => ({
          name: `User ${i}`,
          age: 20 + i,
          email: `user${i}@example.com`,
          data: 'x'.repeat(1000)
        })
      );

      const start = performance.now();
      await client.batch<TestEntity>(
        TEST_STORE_NAME,
        entities.map(entity => ({ type: 'add', data: entity }))
      );
      const end = performance.now();

      console.log(`批量写入(100条)时间: ${end - start}ms`);
      expect(end - start).toBeLessThan(100); // 期望小于 100ms
    });
  });

  describe('读取性能', () => {
    beforeEach(async () => {
      // 准备测试数据
      const entities: Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt'>[] = Array.from(
        { length: TEST_DATA_SIZE },
        (_, i) => ({
          name: `User ${i}`,
          age: 20 + i,
          email: `user${i}@example.com`,
          data: 'x'.repeat(1000)
        })
      );

      await client.batch<TestEntity>(
        TEST_STORE_NAME,
        entities.map(entity => ({ type: 'add', data: entity }))
      );
    });

    it('单条记录查询性能', async () => {
      const start = performance.now();
      const result = await client.findById<TestEntity>(TEST_STORE_NAME, '1');
      const end = performance.now();

      console.log(`单条记录查询时间: ${end - start}ms`);
      expect(end - start).toBeLessThan(5); // 期望小于 5ms
    });

    it('批量查询性能', async () => {
      const options: QueryOptions = {
        where: { age: { $gt: 25 } },
        limit: 100
      };

      const start = performance.now();
      const results = await client.query<TestEntity>(TEST_STORE_NAME, options);
      const end = performance.now();

      console.log(`批量查询(100条)时间: ${end - start}ms`);
      expect(end - start).toBeLessThan(50); // 期望小于 50ms
    });

    it('排序查询性能', async () => {
      const options: QueryOptions = {
        orderBy: ['age', 'desc'],
        limit: 100
      };

      const start = performance.now();
      const results = await client.query<TestEntity>(TEST_STORE_NAME, options);
      const end = performance.now();

      console.log(`排序查询(100条)时间: ${end - start}ms`);
      expect(end - start).toBeLessThan(50); // 期望小于 50ms
    });
  });

  describe('缓存性能', () => {
    it('缓存命中性能', async () => {
      const entity = await client.create<TestEntity>(TEST_STORE_NAME, {
        name: 'Test User',
        age: 25,
        email: 'test@example.com',
        data: 'x'.repeat(1000)
      });

      // 第一次查询（缓存未命中）
      const start1 = performance.now();
      await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      const end1 = performance.now();

      // 第二次查询（缓存命中）
      const start2 = performance.now();
      await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      const end2 = performance.now();

      console.log(`缓存未命中时间: ${end1 - start1}ms`);
      console.log(`缓存命中时间: ${end2 - start2}ms`);
      expect(end2 - start2).toBeLessThan(end1 - start1); // 缓存命中应该更快
    });
  });

  describe('并发性能', () => {
    it('并发写入性能', async () => {
      const entities: Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt'>[] = Array.from(
        { length: 100 },
        (_, i) => ({
          name: `User ${i}`,
          age: 20 + i,
          email: `user${i}@example.com`,
          data: 'x'.repeat(1000)
        })
      );

      const start = performance.now();
      await Promise.all(
        entities.map(entity =>
          client.create<TestEntity>(TEST_STORE_NAME, entity)
        )
      );
      const end = performance.now();

      console.log(`并发写入(100条)时间: ${end - start}ms`);
      expect(end - start).toBeLessThan(200); // 期望小于 200ms
    });

    it('并发查询性能', async () => {
      const options: QueryOptions = {
        limit: 10
      };

      const start = performance.now();
      await Promise.all(
        Array.from({ length: 10 }, () =>
          client.query<TestEntity>(TEST_STORE_NAME, options)
        )
      );
      const end = performance.now();

      console.log(`并发查询(10次)时间: ${end - start}ms`);
      expect(end - start).toBeLessThan(100); // 期望小于 100ms
    });
  });

  describe('内存使用', () => {
    it('大量数据内存使用', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // 创建大量数据
      const entities: Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt'>[] = Array.from(
        { length: TEST_DATA_SIZE },
        (_, i) => ({
          name: `User ${i}`,
          age: 20 + i,
          email: `user${i}@example.com`,
          data: 'x'.repeat(1000)
        })
      );

      await client.batch<TestEntity>(
        TEST_STORE_NAME,
        entities.map(entity => ({ type: 'add', data: entity }))
      );

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`内存增加: ${memoryIncrease / 1024 / 1024}MB`);
      expect(memoryIncrease / 1024 / 1024).toBeLessThan(100); // 期望内存增加小于 100MB
    });
  });
}); 