import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OptimizedIndexedDBClient } from '../../../../clients/indexeddb/optimized-indexeddb-client';
import { BaseEntity } from '../../../../types/base-entity';
import { QueryOptions, BatchOperation } from '../../../../types/database.types';
import { IDatabaseTransaction } from '../../../../interfaces';

interface TestEntity extends BaseEntity {
  name: string;
  age: number;
  email: string;
}

describe('OptimizedIndexedDBClient', () => {
  let client: OptimizedIndexedDBClient;
  const TEST_DB_NAME = 'test-db';
  const TEST_STORE_NAME = 'test-store';

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

  describe('基础操作', () => {
    it('应该成功创建记录', async () => {
      const entity: Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test User',
        age: 25,
        email: 'test@example.com'
      };

      const result = await client.create<TestEntity>(TEST_STORE_NAME, entity);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(entity.name);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('应该成功查询记录', async () => {
      const entity = await client.create<TestEntity>(TEST_STORE_NAME, {
        name: 'Test User',
        age: 25,
        email: 'test@example.com'
      });

      const found = await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(entity.id);
    });

    it('应该成功更新记录', async () => {
      const entity = await client.create<TestEntity>(TEST_STORE_NAME, {
        name: 'Test User',
        age: 25,
        email: 'test@example.com'
      });

      await client.update<TestEntity>(TEST_STORE_NAME, entity.id, {
        name: 'Updated User'
      });

      const updated = await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      expect(updated?.name).toBe('Updated User');
      expect(updated?.age).toBe(25); // 未更新字段保持不变
    });

    it('应该成功删除记录', async () => {
      const entity = await client.create<TestEntity>(TEST_STORE_NAME, {
        name: 'Test User',
        age: 25,
        email: 'test@example.com'
      });

      await client.delete(TEST_STORE_NAME, entity.id);
      const deleted = await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      expect(deleted).toBeNull();
    });
  });

  describe('批量操作', () => {
    it('应该成功执行批量创建操作', async () => {
      const entities: Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt'>[] = [
        { name: 'User 1', age: 25, email: 'user1@example.com' },
        { name: 'User 2', age: 30, email: 'user2@example.com' },
        { name: 'User 3', age: 35, email: 'user3@example.com' }
      ];

      await client.batch<TestEntity>(TEST_STORE_NAME, entities.map(entity => ({
        type: 'add',
        data: entity
      })));

      const all = await client.findAll<TestEntity>(TEST_STORE_NAME);
      expect(all).toHaveLength(3);
    });

    it('应该成功执行批量更新操作', async () => {
      const entity = await client.create<TestEntity>(TEST_STORE_NAME, {
        name: 'Test User',
        age: 25,
        email: 'test@example.com'
      });

      await client.batch<TestEntity>(TEST_STORE_NAME, [{
        type: 'put',
        data: { ...entity, name: 'Updated User' }
      }]);

      const updated = await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      expect(updated?.name).toBe('Updated User');
    });

    it('应该成功执行批量删除操作', async () => {
      const entities = await Promise.all([
        client.create<TestEntity>(TEST_STORE_NAME, { name: 'User 1', age: 25, email: 'user1@example.com' }),
        client.create<TestEntity>(TEST_STORE_NAME, { name: 'User 2', age: 30, email: 'user2@example.com' }),
        client.create<TestEntity>(TEST_STORE_NAME, { name: 'User 3', age: 35, email: 'user3@example.com' })
      ]);

      await client.batch<TestEntity>(TEST_STORE_NAME, entities.map(entity => ({
        type: 'delete',
        data: entity
      })));

      const all = await client.findAll<TestEntity>(TEST_STORE_NAME);
      expect(all).toHaveLength(0);
    });
  });

  describe('查询操作', () => {
    beforeEach(async () => {
      // 创建测试数据
      await Promise.all([
        client.create<TestEntity>(TEST_STORE_NAME, { name: 'Alice', age: 25, email: 'alice@example.com' }),
        client.create<TestEntity>(TEST_STORE_NAME, { name: 'Bob', age: 30, email: 'bob@example.com' }),
        client.create<TestEntity>(TEST_STORE_NAME, { name: 'Charlie', age: 35, email: 'charlie@example.com' })
      ]);
    });

    it('应该支持基本过滤查询', async () => {
      const options: QueryOptions = {
        where: { age: { $gt: 25 } }
      };

      const results = await client.query<TestEntity>(TEST_STORE_NAME, options);
      expect(results.data).toHaveLength(2);
      expect(results.data.every((r: TestEntity) => r.age > 25)).toBe(true);
    });

    it('应该支持排序', async () => {
      const options: QueryOptions = {
        orderBy: ['age', 'desc']
      };

      const results = await client.query<TestEntity>(TEST_STORE_NAME, options);
      expect(results.data[0].age).toBe(35);
      expect(results.data[2].age).toBe(25);
    });

    it('应该支持分页', async () => {
      const options: QueryOptions = {
        limit: 2,
        offset: 1
      };

      const results = await client.query<TestEntity>(TEST_STORE_NAME, options);
      expect(results.data).toHaveLength(2);
    });

    it('应该支持复合查询', async () => {
      const options: QueryOptions = {
        where: { age: { $gt: 25 } },
        orderBy: ['name', 'asc'],
        limit: 2
      };

      const results = await client.query<TestEntity>(TEST_STORE_NAME, options);
      expect(results.data).toHaveLength(2);
      expect(results.data.every((r: TestEntity) => r.age > 25)).toBe(true);
      expect(results.data[0].name <= results.data[1].name).toBe(true);
    });
  });

  describe('缓存系统', () => {
    it('应该缓存查询结果', async () => {
      const entity = await client.create<TestEntity>(TEST_STORE_NAME, {
        name: 'Test User',
        age: 25,
        email: 'test@example.com'
      });

      // 第一次查询
      const firstQuery = await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      
      // 修改数据
      await client.update<TestEntity>(TEST_STORE_NAME, entity.id, {
        name: 'Updated User'
      });

      // 第二次查询应该返回更新后的数据
      const secondQuery = await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      expect(secondQuery?.name).toBe('Updated User');
    });

    it('应该在缓存过期后重新查询', async () => {
      const entity = await client.create<TestEntity>(TEST_STORE_NAME, {
        name: 'Test User',
        age: 25,
        email: 'test@example.com'
      });

      // 模拟时间流逝
      vi.setSystemTime(new Date(Date.now() + 6 * 60 * 1000)); // 6分钟后

      // 查询应该重新从数据库获取
      const result = await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      expect(result).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该在查询不存在的记录时返回 null', async () => {
      const result = await client.findById<TestEntity>(TEST_STORE_NAME, 'non-existent-id');
      expect(result).toBeNull();
    });

    it('应该在更新不存在的记录时抛出错误', async () => {
      await expect(client.update<TestEntity>(TEST_STORE_NAME, 'non-existent-id', {
        name: 'Updated User'
      })).rejects.toThrow();
    });

    it('应该在删除不存在的记录时抛出错误', async () => {
      await expect(client.delete(TEST_STORE_NAME, 'non-existent-id')).rejects.toThrow();
    });
  });

  describe('事务支持', () => {
    it('应该在事务中执行操作', async () => {
      const entity = await client.create<TestEntity>(TEST_STORE_NAME, {
        name: 'Test User',
        age: 25,
        email: 'test@example.com'
      });

      await client.transaction(async (tx: IDatabaseTransaction) => {
        await tx.update<TestEntity>(TEST_STORE_NAME, entity.id, {
          name: 'Updated User'
        });
      });

      const result = await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      expect(result?.name).toBe('Updated User');
    });

    it('应该在事务失败时回滚', async () => {
      const entity = await client.create<TestEntity>(TEST_STORE_NAME, {
        name: 'Test User',
        age: 25,
        email: 'test@example.com'
      });

      await expect(client.transaction(async (tx: IDatabaseTransaction) => {
        await tx.update<TestEntity>(TEST_STORE_NAME, entity.id, {
          name: 'Updated User'
        });
        throw new Error('Transaction failed');
      })).rejects.toThrow();

      const result = await client.findById<TestEntity>(TEST_STORE_NAME, entity.id);
      expect(result?.name).toBe('Test User');
    });
  });
}); 