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
  largeData: string;
  complexData: {
    nested: {
      field1: string;
      field2: number;
      array: string[];
    };
    metadata: {
      tags: string[];
      attributes: Record<string, any>;
    };
  };
}

describe('IndexedDBClient Boundary Tests', () => {
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

  describe('大对象存储测试', () => {
    it('should handle large objects (>10MB)', async () => {
      // 创建一个超过 10MB 的字符串
      const largeString = 'x'.repeat(11 * 1024 * 1024);
      const entity: TestEntity = {
        id: 'test-1',
        name: 'test',
        value: 100,
        largeData: largeString,
        complexData: {
          nested: {
            field1: 'value1',
            field2: 42,
            array: ['item1', 'item2']
          },
          metadata: {
            tags: ['tag1', 'tag2'],
            attributes: {}
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 测试创建大对象
      await expect(client.create(tableName, entity)).rejects.toThrow('QuotaExceededError');
    });

    it('should handle complex nested objects', async () => {
      const complexEntity: TestEntity = {
        id: 'test-2',
        name: 'test',
        value: 100,
        largeData: 'normal',
        complexData: {
          nested: {
            field1: 'value1',
            field2: 42,
            array: Array(1000).fill('item') // 创建大量数组元素
          },
          metadata: {
            tags: Array(1000).fill('tag'), // 创建大量标签
            attributes: Object.fromEntries(
              Array(1000).fill(null).map((_, i) => [`key${i}`, `value${i}`])
            )
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 测试创建复杂对象
      await expect(client.create(tableName, complexEntity)).rejects.toThrow('QuotaExceededError');
    });
  });

  describe('复杂索引组合测试', () => {
    it('should handle multiple field indexes', async () => {
      const entity: TestEntity = {
        id: 'test-3',
        name: 'test',
        value: 100,
        largeData: 'normal',
        complexData: {
          nested: {
            field1: 'value1',
            field2: 42,
            array: ['item1', 'item2']
          },
          metadata: {
            tags: ['tag1', 'tag2'],
            attributes: {}
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 创建多个索引
      await client.create(tableName, entity);

      // 测试多字段查询
      const result = await client.query<TestEntity>(tableName, {
        where: [
          { field: 'name', operator: '==', value: 'test' },
          { field: 'value', operator: '>', value: 50 }
        ]
      });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('test-3');
    });

    it('should handle unique index constraints', async () => {
      const entity1: TestEntity = {
        id: 'test-4',
        name: 'unique-test',
        value: 100,
        largeData: 'normal',
        complexData: {
          nested: {
            field1: 'value1',
            field2: 42,
            array: ['item1', 'item2']
          },
          metadata: {
            tags: ['tag1', 'tag2'],
            attributes: {}
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const entity2: TestEntity = {
        ...entity1,
        id: 'test-5'
      };

      // 创建第一个实体
      await client.create(tableName, entity1);

      // 尝试创建具有相同唯一字段的第二个实体
      await expect(client.create(tableName, entity2)).rejects.toThrow('ConstraintError');
    });
  });

  describe('版本升级场景测试', () => {
    it('should handle database version upgrade', async () => {
      // 创建初始版本数据库
      const initialConfig: DatabaseConfig = {
        ...dbConfig,
        version: 1
      };

      const initialClient = new IndexedDBClient(initialConfig);
      await initialClient.initialize();

      // 创建一些测试数据
      const entity: TestEntity = {
        id: 'test-6',
        name: 'test',
        value: 100,
        largeData: 'normal',
        complexData: {
          nested: {
            field1: 'value1',
            field2: 42,
            array: ['item1', 'item2']
          },
          metadata: {
            tags: ['tag1', 'tag2'],
            attributes: {}
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await initialClient.create(tableName, entity);
      await initialClient.close();

      // 升级数据库版本
      const upgradedConfig: DatabaseConfig = {
        ...dbConfig,
        version: 2
      };

      const upgradedClient = new IndexedDBClient(upgradedConfig);
      await upgradedClient.initialize();

      // 验证数据是否保留
      const result = await upgradedClient.findById<TestEntity>(tableName, 'test-6');
      expect(result).toBeTruthy();
      expect(result?.name).toBe('test');
      expect(result?.value).toBe(100);

      await upgradedClient.close();
    });

    it('should handle data migration during upgrade', async () => {
      // 创建初始版本数据库
      const initialConfig: DatabaseConfig = {
        ...dbConfig,
        version: 1
      };

      const initialClient = new IndexedDBClient(initialConfig);
      await initialClient.initialize();

      // 创建旧格式数据
      const oldEntity = {
        id: 'test-7',
        name: 'test',
        value: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await initialClient.create(tableName, oldEntity);
      await initialClient.close();

      // 升级数据库版本并迁移数据
      const upgradedConfig: DatabaseConfig = {
        ...dbConfig,
        version: 2
      };

      const upgradedClient = new IndexedDBClient(upgradedConfig);
      await upgradedClient.initialize();

      // 验证数据是否已迁移
      const result = await upgradedClient.findById<TestEntity>(tableName, 'test-7');
      expect(result).toBeTruthy();
      expect(result?.name).toBe('test');
      expect(result?.value).toBe(100);
      expect(result?.complexData).toBeDefined();

      await upgradedClient.close();
    });
  });
}); 