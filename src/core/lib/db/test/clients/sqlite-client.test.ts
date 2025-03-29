import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SQLiteClient } from '@db/clients/capacitor-sqlite/sqlite-client';
import type { BaseEntity } from '@db/types/base-entity';
import type { QueryOptions, DatabaseConfig } from '@db/interfaces';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite } from '@capacitor-community/sqlite';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(true),
    getPlatform: vi.fn().mockReturnValue('android')
  }
}));

// Mock SQLite plugin
vi.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: {
    createConnection: vi.fn(),
    closeConnection: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    execute: vi.fn(),
    query: vi.fn(),
    run: vi.fn(),
    beginTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    rollbackTransaction: vi.fn()
  }
}));

interface TestEntity extends BaseEntity {
  name: string;
  value: number;
}

describe('SQLiteClient', () => {
  let client: SQLiteClient;
  const dbName = 'test.db';
  const tableName = 'test_table';

  beforeEach(async () => {
    // 重置所有 mock
    vi.clearAllMocks();
    
    // 创建新的客户端实例
    client = new SQLiteClient({
      name: dbName,
      version: 1,
      engine: 'sqlite'
    });
  });

  afterEach(async () => {
    try {
      await client.close();
    } catch (error) {
      console.error('关闭数据库失败:', error);
    }
  });

  describe('Connection Management', () => {
    it('should initialize database connection successfully', async () => {
      // Mock 成功的连接响应
      (CapacitorSQLite.createConnection as any).mockResolvedValueOnce(true);
      (CapacitorSQLite.open as any).mockResolvedValueOnce({ result: true });

      await client.initialize();
      
      expect(CapacitorSQLite.createConnection).toHaveBeenCalledWith({
        database: dbName,
        encrypted: false,
        mode: 'no-encryption'
      });
      expect(CapacitorSQLite.open).toHaveBeenCalled();
    });

    it('should handle connection errors gracefully', async () => {
      // Mock 连接失败
      (CapacitorSQLite.createConnection as any).mockRejectedValueOnce(new Error('连接失败'));

      await expect(client.initialize()).rejects.toThrow('连接失败');
    });

    it('should close connection successfully', async () => {
      // Mock 成功的关闭响应
      (CapacitorSQLite.close as any).mockResolvedValueOnce({ result: true });
      (CapacitorSQLite.closeConnection as any).mockResolvedValueOnce({ result: true });

      await client.initialize();
      await client.close();

      expect(CapacitorSQLite.close).toHaveBeenCalled();
      expect(CapacitorSQLite.closeConnection).toHaveBeenCalled();
    });
  });

  describe('SQL Query Generation', () => {
    beforeEach(async () => {
      // Mock 成功的连接
      (CapacitorSQLite.createConnection as any).mockResolvedValueOnce(true);
      (CapacitorSQLite.open as any).mockResolvedValueOnce({ result: true });
      await client.initialize();
    });

    it('should generate correct SELECT query', async () => {
      const mockResult = { values: [{ id: '1', name: 'test', value: 123 }] };
      (CapacitorSQLite.query as any).mockResolvedValueOnce(mockResult);

      await client.findById(tableName, '1');

      expect(CapacitorSQLite.query).toHaveBeenCalledWith({
        statement: 'SELECT * FROM test_table WHERE id = ?',
        values: ['1']
      });
    });

    it('should generate correct INSERT query', async () => {
      const testEntity: TestEntity = {
        id: '1',
        name: 'test',
        value: 123,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (CapacitorSQLite.run as any).mockResolvedValueOnce({ changes: 1 });

      await client.create(tableName, testEntity);

      expect(CapacitorSQLite.run).toHaveBeenCalledWith(
        expect.objectContaining({
          statement: expect.stringContaining('INSERT INTO test_table'),
          values: expect.arrayContaining([testEntity.id, testEntity.name, testEntity.value])
        })
      );
    });

    it('should generate correct UPDATE query', async () => {
      const updates = { name: 'updated', value: 456 };
      
      (CapacitorSQLite.run as any).mockResolvedValueOnce({ changes: 1 });

      await client.update(tableName, '1', updates);

      expect(CapacitorSQLite.run).toHaveBeenCalledWith(
        expect.objectContaining({
          statement: expect.stringContaining('UPDATE test_table SET'),
          values: expect.arrayContaining(['updated', 456, '1'])
        })
      );
    });

    it('should generate correct DELETE query', async () => {
      (CapacitorSQLite.run as any).mockResolvedValueOnce({ changes: 1 });

      await client.delete(tableName, '1');

      expect(CapacitorSQLite.run).toHaveBeenCalledWith({
        statement: 'DELETE FROM test_table WHERE id = ?',
        values: ['1']
      });
    });
  });

  describe('Transaction Management', () => {
    beforeEach(async () => {
      // Mock 成功的连接
      (CapacitorSQLite.createConnection as any).mockResolvedValueOnce(true);
      (CapacitorSQLite.open as any).mockResolvedValueOnce({ result: true });
      await client.initialize();
    });

    it('should handle successful transaction', async () => {
      // Mock 事务相关方法
      (CapacitorSQLite.beginTransaction as any).mockResolvedValueOnce({ result: true });
      (CapacitorSQLite.run as any).mockResolvedValueOnce({ changes: 1 });
      (CapacitorSQLite.commitTransaction as any).mockResolvedValueOnce({ result: true });

      const result = await client.transaction(async () => {
        const testEntity: TestEntity = {
          id: '1',
          name: 'test',
          value: 123,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await client.create(tableName, testEntity);
        return testEntity;
      });

      expect(CapacitorSQLite.beginTransaction).toHaveBeenCalled();
      expect(CapacitorSQLite.run).toHaveBeenCalled();
      expect(CapacitorSQLite.commitTransaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should rollback transaction on error', async () => {
      // Mock 事务相关方法
      (CapacitorSQLite.beginTransaction as any).mockResolvedValueOnce({ result: true });
      (CapacitorSQLite.run as any).mockRejectedValueOnce(new Error('操作失败'));
      (CapacitorSQLite.rollbackTransaction as any).mockResolvedValueOnce({ result: true });

      await expect(client.transaction(async () => {
        const testEntity: TestEntity = {
          id: '1',
          name: 'test',
          value: 123,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await client.create(tableName, testEntity);
        return testEntity;
      })).rejects.toThrow('操作失败');

      expect(CapacitorSQLite.beginTransaction).toHaveBeenCalled();
      expect(CapacitorSQLite.rollbackTransaction).toHaveBeenCalled();
    });
  });
}); 