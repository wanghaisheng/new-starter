import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseClient } from '@db/clients/base-client';
import type { BaseEntity } from '@db/types/base-entity';
import type { QueryOptions } from '@db/interfaces';

interface TestEntity extends BaseEntity {
  name: string;
  value: number;
}

// 创建一个具体的 BaseClient 实现用于测试
class TestBaseClient extends BaseClient {
  private data: Map<string, TestEntity> = new Map();
  private shouldThrowError = false;
  protected initialized = false;

  constructor() {
    super();
  }

  setShouldThrowError(value: boolean) {
    this.shouldThrowError = value;
  }

  protected checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('数据库客户端未初始化');
    }
  }

  async initialize(): Promise<void> {
    if (this.shouldThrowError) {
      throw new Error('初始化失败');
    }
    this.initialized = true;
  }

  async close(): Promise<void> {
    if (this.shouldThrowError) {
      throw new Error('关闭失败');
    }
    this.initialized = false;
    this.data.clear();
  }

  async clear(): Promise<void> {
    this.checkInitialized();
    if (this.shouldThrowError) {
      throw new Error('清理失败');
    }
    this.data.clear();
  }

  async findById<T>(tableName: string, id: string): Promise<T | null> {
    this.checkInitialized();
    if (this.shouldThrowError) {
      throw new Error('查询失败');
    }
    return this.data.get(id) as T || null;
  }

  async findAll<T>(tableName: string, filter?: Record<string, any>): Promise<T[]> {
    this.checkInitialized();
    if (this.shouldThrowError) {
      throw new Error('查询失败');
    }
    return Array.from(this.data.values()) as T[];
  }

  async create<T extends { id: string }>(tableName: string, data: T): Promise<T> {
    this.checkInitialized();
    if (this.shouldThrowError) {
      throw new Error('创建失败');
    }
    this.data.set(data.id, data as unknown as TestEntity);
    return data;
  }

  async update<T extends { id: string }>(tableName: string, id: string, data: Partial<T>): Promise<void> {
    this.checkInitialized();
    if (this.shouldThrowError) {
      throw new Error('更新失败');
    }
    const existing = this.data.get(id);
    if (existing) {
      this.data.set(id, { ...existing, ...data as unknown as Partial<TestEntity> });
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    this.checkInitialized();
    if (this.shouldThrowError) {
      throw new Error('删除失败');
    }
    this.data.delete(id);
  }

  async query<T>(tableName: string, options: {
    select?: string[];
    where?: Record<string, any>;
    orderBy?: string | string[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    this.checkInitialized();
    if (this.shouldThrowError) {
      throw new Error('查询失败');
    }
    return Array.from(this.data.values()) as T[];
  }

  async executeRawQuery(query: string, params?: any[]): Promise<any> {
    this.checkInitialized();
    if (this.shouldThrowError) {
      throw new Error('原始查询失败');
    }
    return [];
  }

  async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    this.checkInitialized();
    if (this.shouldThrowError) {
      throw new Error('事务失败');
    }
    return callback({});
  }
}

describe('BaseClient', () => {
  let client: TestBaseClient;
  const tableName = 'test_table';

  beforeEach(() => {
    client = new TestBaseClient();
  });

  describe('Lifecycle Methods', () => {
    it('should initialize successfully', async () => {
      await client.initialize();
      expect(client['initialized']).toBe(true);
    });

    it('should handle initialization failure', async () => {
      client.setShouldThrowError(true);
      await expect(client.initialize()).rejects.toThrow('初始化失败');
      expect(client['initialized']).toBe(false);
    });

    it('should close successfully', async () => {
      await client.initialize();
      await client.close();
      expect(client['initialized']).toBe(false);
    });

    it('should handle close failure', async () => {
      await client.initialize();
      client.setShouldThrowError(true);
      await expect(client.close()).rejects.toThrow('关闭失败');
      expect(client['initialized']).toBe(true);
    });

    it('should clear data successfully', async () => {
      await client.initialize();
      const testEntity: TestEntity = {
        id: '1',
        name: 'test',
        value: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await client.create<TestEntity>(tableName, testEntity);
      await client.clear();
      const result = await client.findAll<TestEntity>(tableName);
      expect(result).toHaveLength(0);
    });

    it('should handle clear failure', async () => {
      await client.initialize();
      client.setShouldThrowError(true);
      await expect(client.clear()).rejects.toThrow('清理失败');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when accessing methods before initialization', async () => {
      await expect(client.findById<TestEntity>(tableName, '1')).rejects.toThrow('数据库客户端未初始化');
      await expect(client.findAll<TestEntity>(tableName)).rejects.toThrow('数据库客户端未初始化');
      const testEntity: TestEntity = {
        id: '1',
        name: 'test',
        value: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await expect(client.create<TestEntity>(tableName, testEntity)).rejects.toThrow('数据库客户端未初始化');
    });

    it('should handle operation failures', async () => {
      await client.initialize();
      client.setShouldThrowError(true);

      await expect(client.findById<TestEntity>(tableName, '1')).rejects.toThrow('查询失败');
      await expect(client.findAll<TestEntity>(tableName)).rejects.toThrow('查询失败');
      const testEntity: TestEntity = {
        id: '1',
        name: 'test',
        value: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await expect(client.create<TestEntity>(tableName, testEntity)).rejects.toThrow('创建失败');
      await expect(client.update<TestEntity>(tableName, '1', { name: 'updated' } as Partial<TestEntity>)).rejects.toThrow('更新失败');
      await expect(client.delete(tableName, '1')).rejects.toThrow('删除失败');
      await expect(client.query<TestEntity>(tableName, {})).rejects.toThrow('查询失败');
      await expect(client.executeRawQuery('SELECT * FROM test')).rejects.toThrow('原始查询失败');
      await expect(client.transaction(async () => {})).rejects.toThrow('事务失败');
    });
  });

  describe('State Management', () => {
    it('should maintain correct state after operations', async () => {
      await client.initialize();
      
      // 创建实体
      const testEntity: TestEntity = {
        id: '1',
        name: 'test',
        value: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const entity = await client.create<TestEntity>(tableName, testEntity);
      
      // 验证状态
      expect(client['initialized']).toBe(true);
      expect(client['data'].has('1')).toBe(true);
      
      // 更新实体
      await client.update<TestEntity>(tableName, '1', { name: 'updated' } as Partial<TestEntity>);
      const updated = await client.findById<TestEntity>(tableName, '1');
      expect(updated?.name).toBe('updated');
      
      // 删除实体
      await client.delete(tableName, '1');
      expect(client['data'].has('1')).toBe(false);
      
      // 关闭客户端
      await client.close();
      expect(client['initialized']).toBe(false);
      expect(client['data'].size).toBe(0);
    });

    it('should handle concurrent operations correctly', async () => {
      await client.initialize();
      
      const operations = Array(10).fill(null).map((_, i) => {
        const testEntity: TestEntity = {
          id: `concurrent-${i}`,
          name: `test-${i}`,
          value: i,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return client.create<TestEntity>(tableName, testEntity);
      });
      
      await Promise.all(operations);
      const results = await client.findAll<TestEntity>(tableName);
      expect(results).toHaveLength(10);
    });
  });
}); 