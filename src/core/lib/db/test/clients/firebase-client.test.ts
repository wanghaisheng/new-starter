import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FirebaseClient } from '@db/clients/firebase/firebase-client';
import type { BaseEntity } from '@db/types/base-entity';
import type { DatabaseConfig, DatabaseEngine } from '@db/interfaces';
import type { QueryResult, QueryOptions } from '@db/types/database.types';

// Mock Firebase
const mockFirebase = {
  initializeApp: vi.fn(),
  getDatabase: vi.fn(),
  ref: vi.fn(),
  onValue: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  query: vi.fn(),
  orderByChild: vi.fn(),
  equalTo: vi.fn(),
  limitToLast: vi.fn(),
  get: vi.fn(),
  push: vi.fn(),
  goOffline: vi.fn(),
  goOnline: vi.fn(),
  enablePersistence: vi.fn(),
  setPersistenceEnabled: vi.fn()
};

vi.stubGlobal('firebase', mockFirebase);

interface TestEntity extends BaseEntity {
  name: string;
  value: number;
  data: string;
}

describe('FirebaseClient Tests', () => {
  let client: FirebaseClient;
  const dbName = 'test.db';
  const tableName = 'test_table';

  const firebaseConfig = {
    apiKey: 'test-api-key',
    authDomain: 'test-auth-domain',
    projectId: 'test-project-id',
    storageBucket: 'test-storage-bucket',
    messagingSenderId: 'test-messaging-sender-id',
    appId: 'test-app-id'
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    client = new FirebaseClient(firebaseConfig);
    await client.initialize();
  });

  afterEach(async () => {
    try {
      await client.close();
    } catch (error) {
      console.error('关闭数据库失败:', error);
    }
  });

  describe('实时同步测试', () => {
    it('should handle real-time updates', async () => {
      const entity: TestEntity = {
        id: 'test-1',
        name: 'test',
        value: 100,
        data: 'initial',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 模拟实时更新
      const mockSnapshot = {
        val: () => ({
          ...entity,
          value: 200
        })
      };

      mockFirebase.onValue.mockImplementation((ref, callback) => {
        callback(mockSnapshot);
      });

      // 创建实体
      await client.create(tableName, entity);

      // 验证实时更新
      const result = await client.findById<TestEntity>(tableName, 'test-1');
      expect(result?.value).toBe(200);
    });

    it('should handle multiple real-time listeners', async () => {
      const entities: TestEntity[] = [
        {
          id: 'test-1',
          name: 'test1',
          value: 100,
          data: 'data1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'test-2',
          name: 'test2',
          value: 200,
          data: 'data2',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // 模拟多个实时更新
      const mockSnapshots = [
        { val: () => ({ ...entities[0], value: 150 }) },
        { val: () => ({ ...entities[1], value: 250 }) }
      ];

      mockFirebase.onValue.mockImplementation((ref, callback) => {
        mockSnapshots.forEach(snapshot => callback(snapshot));
      });

      // 创建多个实体
      await Promise.all(entities.map(entity => client.create(tableName, entity)));

      // 验证实时更新
      const queryOptions: QueryOptions = {
        where: {
          field: 'id',
          operator: '>=',
          value: 'test-1'
        }
      };
      const result = await client.query<TestEntity>(tableName, queryOptions);
      expect(result.data[0].value).toBe(150);
      expect(result.data[1].value).toBe(250);
    });
  });

  describe('离线支持测试', () => {
    it('should handle offline operations', async () => {
      // 启用离线持久化
      await client.initialize();

      // 模拟离线状态
      mockFirebase.goOffline();

      const entity: TestEntity = {
        id: 'test-3',
        name: 'test',
        value: 100,
        data: 'offline',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 离线创建实体
      await client.create(tableName, entity);

      // 验证本地数据
      const result = await client.findById<TestEntity>(tableName, 'test-3');
      expect(result).toBeTruthy();
      expect(result?.data).toBe('offline');

      // 恢复在线状态
      mockFirebase.goOnline();

      // 验证数据同步
      const syncedResult = await client.findById<TestEntity>(tableName, 'test-3');
      expect(syncedResult).toBeTruthy();
      expect(syncedResult?.data).toBe('offline');
    });

    it('should handle offline query operations', async () => {
      // 启用离线持久化
      await client.initialize();

      // 创建测试数据
      const entities: TestEntity[] = Array(5).fill(null).map((_, index) => ({
        id: `test-${index + 4}`,
        name: `test-${index}`,
        value: index * 100,
        data: `data-${index}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await Promise.all(entities.map(entity => client.create(tableName, entity)));

      // 模拟离线状态
      mockFirebase.goOffline();

      // 执行离线查询
      const queryOptions: QueryOptions = {
        where: {
          field: 'value',
          operator: '>',
          value: 200
        }
      };
      const result = await client.query<TestEntity>(tableName, queryOptions);

      expect(result.data.length).toBe(3); // 应该返回3个结果
      expect(result.data.every(entity => entity.value > 200)).toBe(true);
    });
  });

  describe('安全规则测试', () => {
    it('should handle read permission rules', async () => {
      const entity: TestEntity = {
        id: 'test-9',
        name: 'test',
        value: 100,
        data: 'private',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 模拟读取权限错误
      mockFirebase.get.mockRejectedValueOnce(new Error('Permission denied'));

      // 尝试读取受保护的实体
      await expect(client.findById<TestEntity>(tableName, 'test-9')).rejects.toThrow('Permission denied');
    });

    it('should handle write permission rules', async () => {
      const entity: TestEntity = {
        id: 'test-10',
        name: 'test',
        value: 100,
        data: 'private',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 模拟写入权限错误
      mockFirebase.set.mockRejectedValueOnce(new Error('Permission denied'));

      // 尝试创建受保护的实体
      await expect(client.create(tableName, entity)).rejects.toThrow('Permission denied');
    });

    it('should handle validation rules', async () => {
      const invalidEntity: TestEntity = {
        id: 'test-11',
        name: '', // 空名称应该被验证规则拒绝
        value: 100,
        data: 'test',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 模拟验证规则错误
      mockFirebase.set.mockRejectedValueOnce(new Error('Validation failed'));

      // 尝试创建无效实体
      await expect(client.create(tableName, invalidEntity)).rejects.toThrow('Validation failed');
    });
  });
}); 