import { MockIndexedDBClient } from '../../clients/mock/indexeddb-client';
import { User } from '../../types';

describe('MockIndexedDBClient', () => {
  let client: MockIndexedDBClient;

  beforeEach(async () => {
    client = new MockIndexedDBClient('test_db');
    await client.initialize();
  });

  afterEach(async () => {
    await client.clear();
    await client.close();
  });

  describe('基础 CRUD 操作', () => {
    const testUser: Partial<User> = {
      name: 'Test User',
      email: 'test@example.com',
      photoUrl: 'https://example.com/photo.jpg',
      bio: 'Test bio',
      interests: ['coding', 'reading'],
      birthDate: new Date('1990-01-01')
    };

    it('应该能够创建用户', async () => {
      const user = await client.create<User>('users', testUser as User);
      
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.name).toBe(testUser.name);
      expect(user.email).toBe(testUser.email);
    });

    it('应该能够通过 ID 查找用户', async () => {
      const createdUser = await client.create<User>('users', testUser as User);
      const foundUser = await client.findById<User>('users', createdUser.id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
    });

    it('应该能够更新用户', async () => {
      const createdUser = await client.create<User>('users', testUser as User);
      const updateData = { name: 'Updated Name' };
      
      await client.update<User>('users', createdUser.id, updateData);
      const updatedUser = await client.findById<User>('users', createdUser.id);
      
      expect(updatedUser?.name).toBe(updateData.name);
      expect(updatedUser?.updatedAt.getTime()).toBeGreaterThan(createdUser.updatedAt.getTime());
    });

    it('应该能够删除用户', async () => {
      const createdUser = await client.create<User>('users', testUser as User);
      
      await client.delete('users', createdUser.id);
      const deletedUser = await client.findById<User>('users', createdUser.id);
      
      expect(deletedUser).toBeNull();
    });
  });

  describe('查询操作', () => {
    beforeEach(async () => {
      // 创建测试数据
      await client.create<User>('users', {
        name: 'User 1',
        email: 'user1@example.com',
        interests: ['coding'],
        birthDate: new Date('1990-01-01')
      } as User);
      
      await client.create<User>('users', {
        name: 'User 2',
        email: 'user2@example.com',
        interests: ['reading'],
        birthDate: new Date('1991-01-01')
      } as User);
    });

    it('应该能够查询所有用户', async () => {
      const users = await client.findAll<User>('users');
      expect(users.length).toBe(2);
    });

    it('应该能够按条件过滤用户', async () => {
      const users = await client.query<User>('users', {
        where: { interests: ['coding'] }
      });
      expect(users.length).toBe(1);
      expect(users[0].email).toBe('user1@example.com');
    });

    it('应该能够按字段排序', async () => {
      const users = await client.query<User>('users', {
        orderBy: 'birthDate'
      });
      expect(users[0].email).toBe('user1@example.com');
      expect(users[1].email).toBe('user2@example.com');
    });

    it('应该能够选择特定字段', async () => {
      const users = await client.query<User>('users', {
        select: ['name', 'email']
      });
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).not.toHaveProperty('interests');
    });
  });

  describe('事务操作', () => {
    it('应该能够执行事务', async () => {
      const result = await client.transaction(async (tx) => {
        const userStore = tx.objectStore('users');
        const user = {
          name: 'Transaction User',
          email: 'transaction@example.com',
          interests: ['coding'],
          birthDate: new Date('1990-01-01')
        } as User;
        
        await userStore.add(user);
        return user;
      });

      const savedUser = await client.findById<User>('users', result.id);
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe('transaction@example.com');
    });

    it('应该在事务失败时回滚', async () => {
      await expect(client.transaction(async (tx) => {
        const userStore = tx.objectStore('users');
        const user = {
          name: 'Transaction User',
          email: 'transaction@example.com',
          interests: ['coding'],
          birthDate: new Date('1990-01-01')
        } as User;
        
        await userStore.add(user);
        throw new Error('Transaction failed');
      })).rejects.toThrow('Transaction failed');

      const users = await client.findAll<User>('users');
      expect(users.length).toBe(0);
    });
  });
}); 