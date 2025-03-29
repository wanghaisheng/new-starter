import { IndexedDBClient } from '../../../clients/indexeddb/indexeddb-client';
import { presetData } from '../mock/preset-data';

describe('IndexedDB Client Persistence', () => {
  let client: IndexedDBClient;
  const dbName = 'test-db-persistence';
  const dbVersion = 1;

  beforeEach(async () => {
    // 创建新的客户端实例
    client = new IndexedDBClient({
      name: dbName,
      version: dbVersion
    });
    
    // 初始化数据库
    await client.initialize();
  });

  afterEach(async () => {
    // 清理数据库
    await client.clear();
    await client.close();
  });

  describe('Data Persistence', () => {
    it('should persist data between sessions', async () => {
      // 创建测试数据
      const testUser = presetData.users[0];
      
      // 保存数据
      await client.create('users', testUser);
      
      // 关闭数据库连接
      await client.close();
      
      // 重新打开数据库连接
      client = new IndexedDBClient({
        name: dbName,
        version: dbVersion
      });
      await client.initialize();
      
      // 验证数据是否仍然存在
      const retrievedUser = await client.findById('users', testUser.id);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser).toEqual(testUser);
    });

    it('should persist multiple entities', async () => {
      // 保存多个用户
      for (const user of presetData.users.slice(0, 3)) {
        await client.create('users', user);
      }
      
      // 保存多个匹配
      for (const match of presetData.matches.slice(0, 2)) {
        await client.create('matches', match);
      }
      
      // 保存多个消息
      for (const message of presetData.messages.slice(0, 5)) {
        await client.create('messages', message);
      }
      
      // 关闭并重新打开数据库
      await client.close();
      client = new IndexedDBClient({
        name: dbName,
        version: dbVersion
      });
      await client.initialize();
      
      // 验证所有数据是否仍然存在
      const users = await client.findAll('users');
      const matches = await client.findAll('matches');
      const messages = await client.findAll('messages');
      
      expect(users).toHaveLength(3);
      expect(matches).toHaveLength(2);
      expect(messages).toHaveLength(5);
    });
  });

  describe('Data Updates', () => {
    it('should persist updates to existing data', async () => {
      // 创建并保存初始数据
      const testUser = presetData.users[0];
      await client.create('users', testUser);
      
      // 更新数据
      const updatedUser = {
        ...testUser,
        name: 'Updated Name',
        bio: 'Updated Bio'
      };
      await client.update('users', testUser.id, updatedUser);
      
      // 关闭并重新打开数据库
      await client.close();
      client = new IndexedDBClient({
        name: dbName,
        version: dbVersion
      });
      await client.initialize();
      
      // 验证更新是否持久化
      const retrievedUser = await client.findById('users', testUser.id);
      expect(retrievedUser?.name).toBe('Updated Name');
      expect(retrievedUser?.bio).toBe('Updated Bio');
    });
  });

  describe('Data Deletion', () => {
    it('should persist deletions between sessions', async () => {
      // 创建并保存测试数据
      const testUser = presetData.users[0];
      await client.create('users', testUser);
      
      // 删除数据
      await client.delete('users', testUser.id);
      
      // 关闭并重新打开数据库
      await client.close();
      client = new IndexedDBClient({
        name: dbName,
        version: dbVersion
      });
      await client.initialize();
      
      // 验证数据是否已被删除
      const retrievedUser = await client.findById('users', testUser.id);
      expect(retrievedUser).toBeNull();
    });
  });

  describe('Database Versioning', () => {
    it('should handle database version upgrades', async () => {
      // 创建初始版本的数据
      const testUser = presetData.users[0];
      await client.create('users', testUser);
      
      // 关闭数据库
      await client.close();
      
      // 使用新版本重新打开数据库
      client = new IndexedDBClient({
        name: dbName,
        version: dbVersion + 1
      });
      await client.initialize();
      
      // 验证数据是否在版本升级后仍然存在
      const retrievedUser = await client.findById('users', testUser.id);
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser).toEqual(testUser);
    });
  });
}); 