/**
 * Firebase 客户端单元测试
 * 测试 FirebaseClient 类和辅助类的功能
 */

import { FirebaseClient, FirebaseConfig } from '@/core/lib/db/clients/firebase';
import { getEmulatorConfig, createTestUser, TestUser, TestEntity } from '@/core/lib/db/clients/firebase/tests/test-utils';

describe('FirebaseClient', () => {
  let client: FirebaseClient;
  let config: FirebaseConfig;

  beforeEach(() => {
    // 使用 Firestore 模拟器配置
    config = getEmulatorConfig();
    client = new FirebaseClient(config);
  });

  afterEach(async () => {
    // 测试结束后清理
    if (client) {
      try {
        if ((client as any).initialized) {
          await client.clear();
          await client.close();
        }
      } catch (error) {
        console.error('清理失败', error);
      }
    }
  });

  describe('初始化', () => {
    it('应成功初始化客户端', async () => {
      await expect(client.initialize()).resolves.not.toThrow();
      expect((client as any).initialized).toBe(true);
    });

    it('重复初始化应抛出错误', async () => {
      await client.initialize();
      await expect(client.initialize()).rejects.toThrow();
    });
  });

  describe('基本CRUD操作', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('应成功创建实体', async () => {
      const user = createTestUser();

      const result = await client.create<TestUser>('users', user as any);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(user.name);
      expect(result.email).toBe(user.email);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('应成功查找实体', async () => {
      // 创建测试实体
      const user = await client.create<TestUser>('users', createTestUser() as any);

      // 按ID查找
      const found = await client.findById<TestUser>('users', user.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(user.id);
      expect(found?.name).toBe(user.name);
    });

    it('应成功更新实体', async () => {
      // 创建测试实体
      const user = await client.create<TestUser>('users', createTestUser({
        name: '更新测试',
        email: 'update@example.com'
      }) as any);

      // 更新实体
      const updateData = { name: '已更新' } as Partial<TestUser>;
      await client.update<TestUser>('users', user.id, updateData as any);

      // 验证更新
      const updated = await client.findById<TestUser>('users', user.id);
      expect(updated?.name).toBe('已更新');
      expect(updated?.email).toBe(user.email);
    });

    it('应成功删除实体', async () => {
      // 创建测试实体
      const user = await client.create<TestUser>('users', createTestUser({
        name: '删除测试',
        email: 'delete@example.com'
      }) as any);

      // 删除实体
      await client.delete('users', user.id);

      // 验证删除
      const found = await client.findById<TestUser>('users', user.id);
      expect(found).toBeNull();
    });
  });

  describe('查询操作', () => {
    beforeEach(async () => {
      await client.initialize();
      
      // 创建测试数据
      await client.create<TestUser>('users', createTestUser({ name: '张三', age: 25 }) as any);
      await client.create<TestUser>('users', createTestUser({ name: '李四', age: 30 }) as any);
      await client.create<TestUser>('users', createTestUser({ name: '王五', age: 20 }) as any);
    });

    it('应支持基本查询', async () => {
      const result = await client.query<TestUser>('users', {
        where: {
          field: 'age',
          operator: '>',
          value: 20
        }
      });

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('应支持排序', async () => {
      const result = await client.query<TestUser>('users', {
        orderBy: {
          field: 'age',
          direction: 'desc'
        }
      });

      expect(result.data.length).toBe(3);
      expect(result.data[0].age).toBe(30);
    });

    it('应支持限制结果数量', async () => {
      const result = await client.query<TestUser>('users', {
        limit: 2
      });

      expect(result.data.length).toBe(2);
    });
  });

  describe('批量操作', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('应支持批量创建和更新', async () => {
      // 批量创建
      const operations = [
        {
          type: 'add' as const,
          data: { id: 'batch-1', name: '批量1', age: 25 } as TestEntity
        },
        {
          type: 'add' as const,
          data: { id: 'batch-2', name: '批量2', age: 30 } as TestEntity
        }
      ];

      await client.batch<TestEntity>('users', operations as any);

      // 验证批量创建
      const user1 = await client.findById<TestUser>('users', 'batch-1');
      const user2 = await client.findById<TestUser>('users', 'batch-2');
      
      expect(user1).not.toBeNull();
      expect(user2).not.toBeNull();
      expect(user1?.name).toBe('批量1');
      expect(user2?.name).toBe('批量2');

      // 批量更新
      const updateOperations = [
        {
          type: 'put' as const,
          data: { id: 'batch-1', name: '批量1-更新' } as TestEntity
        },
        {
          type: 'delete' as const,
          data: { id: 'batch-2' } as TestEntity
        }
      ];

      await client.batch<TestEntity>('users', updateOperations as any);

      // 验证批量更新和删除
      const updatedUser1 = await client.findById<TestUser>('users', 'batch-1');
      const deletedUser2 = await client.findById<TestUser>('users', 'batch-2');
      
      expect(updatedUser1?.name).toBe('批量1-更新');
      expect(deletedUser2).toBeNull();
    });
  });

  describe('事务操作', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('应支持事务操作', async () => {
      // 在事务中创建和查询
      const result = await client.transaction(async (tx) => {
        const user = await tx.create<TestUser>('users', createTestUser({
          name: '事务测试',
          email: 'transaction@example.com'
        }) as any);

        const found = await tx.findById<TestUser>('users', user.id);
        
        return { created: user, found };
      });

      expect(result.created.name).toBe('事务测试');
      expect(result.found).not.toBeNull();
      expect(result.found?.id).toBe(result.created.id);
    });

    it('应回滚失败的事务', async () => {
      // 创建初始用户
      const initialUser = await client.create<TestUser>('users', createTestUser({
        name: '事务回滚测试',
        email: 'rollback@example.com'
      }) as any);

      // 执行将失败的事务
      try {
        await client.transaction(async (tx) => {
          // 更新一个用户
          await tx.update<TestUser>('users', initialUser.id, { name: '已更新名称' } as any);
          
          // 故意抛出错误
          throw new Error('事务测试错误');
        });
      } catch (error) {
        // 预期错误
      }

      // 验证更新被回滚
      const userAfterRollback = await client.findById<TestUser>('users', initialUser.id);
      expect(userAfterRollback?.name).toBe('事务回滚测试'); // 原始名称未改变
    });
  });
}); 