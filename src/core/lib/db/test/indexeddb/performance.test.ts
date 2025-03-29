import { IndexedDBClient } from '../../clients/indexeddb/indexeddb-client';
import { presetData } from '../mock/preset-data';
import { IDBPTransaction } from 'idb';

describe('IndexedDB Client Performance', () => {
  let client: IndexedDBClient;
  const dbName = 'test-db-performance';
  const dbVersion = 1;

  beforeEach(async () => {
    client = new IndexedDBClient({
      name: dbName,
      version: dbVersion,
      engine: 'indexeddb'
    });
    await client.initialize();
  });

  afterEach(async () => {
    await client.clear();
    await client.close();
  });

  describe('Bulk Operations', () => {
    it('should handle bulk creation efficiently', async () => {
      const users = presetData.users;
      const startTime = performance.now();

      // 批量创建用户
      for (const user of users) {
        await client.create('users', user);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证创建是否成功
      const retrievedUsers = await client.findAll('users');
      expect(retrievedUsers).toHaveLength(users.length);
      
      // 性能检查：每100条记录应该在1秒内完成
      const recordsPerSecond = (users.length / duration) * 1000;
      expect(recordsPerSecond).toBeGreaterThan(100);
    });

    it('should handle bulk retrieval efficiently', async () => {
      // 准备测试数据
      const users = presetData.users;
      for (const user of users) {
        await client.create('users', user);
      }

      const startTime = performance.now();

      // 批量获取用户
      const retrievedUsers = await client.findAll('users');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证获取是否成功
      expect(retrievedUsers).toHaveLength(users.length);
      
      // 性能检查：每100条记录应该在100ms内完成
      const recordsPerSecond = (users.length / duration) * 1000;
      expect(recordsPerSecond).toBeGreaterThan(1000);
    });
  });

  describe('Query Performance', () => {
    it('should handle filtered queries efficiently', async () => {
      // 准备测试数据
      const users = presetData.users;
      for (const user of users) {
        await client.create('users', user);
      }

      const startTime = performance.now();

      // 执行过滤查询
      const filteredUsers = await client.query('users', {
        where: { interests: { $contains: 'coding' } }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 性能检查：过滤查询应该在50ms内完成
      expect(duration).toBeLessThan(50);
    });

    it('should handle sorted queries efficiently', async () => {
      // 准备测试数据
      const users = presetData.users;
      for (const user of users) {
        await client.create('users', user);
      }

      const startTime = performance.now();

      // 执行排序查询
      const sortedUsers = await client.query('users', {
        orderBy: 'createdAt'
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 性能检查：排序查询应该在50ms内完成
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Transaction Performance', () => {
    it('should handle large transactions efficiently', async () => {
      const startTime = performance.now();

      // 执行大型事务
      await client.transaction(async (tx: IDBPTransaction) => {
        // 创建用户
        for (const user of presetData.users) {
          await client.create('users', user);
        }

        // 创建匹配
        for (const match of presetData.matches) {
          await client.create('matches', match);
        }

        // 创建消息
        for (const message of presetData.messages) {
          await client.create('messages', message);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 性能检查：大型事务应该在200ms内完成
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent reads efficiently', async () => {
      // 准备测试数据
      const users = presetData.users;
      for (const user of users) {
        await client.create('users', user);
      }

      const startTime = performance.now();

      // 并发读取
      const readPromises = users.map(user => 
        client.findById('users', user.id)
      );

      await Promise.all(readPromises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 性能检查：并发读取应该在100ms内完成
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent writes efficiently', async () => {
      const startTime = performance.now();

      // 并发写入
      const writePromises = presetData.users.map(user =>
        client.create('users', user)
      );

      await Promise.all(writePromises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 性能检查：并发写入应该在200ms内完成
      expect(duration).toBeLessThan(200);
    });
  });
}); 