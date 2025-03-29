import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SQLiteClient } from '../../../../clients/capacitor-sqlite/sqlite-client';
import { BaseEntity } from '../../../../types/base-entity';
import { QueryOptions, BatchOperation } from '../../../../types/database.types';

interface TestEntity extends BaseEntity {
  name: string;
  age: number;
  email: string;
}

describe('SQLiteClient', () => {
  let client: SQLiteClient;
  const testConfig = {
    name: 'test-db',
    version: 1
  };

  beforeEach(async () => {
    client = new SQLiteClient(testConfig);
    await client.initialize();
  });

  afterEach(async () => {
    await client.clear();
    await client.close();
  });

  describe('Basic Operations', () => {
    it('should create and retrieve a record', async () => {
      const testData: TestEntity = {
        id: '1',
        name: 'Test User',
        age: 25,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.create('test_table', testData);
      const result = await client.findById<TestEntity>('test_table', '1');

      expect(result).toEqual(testData);
    });

    it('should update a record', async () => {
      const testData: TestEntity = {
        id: '1',
        name: 'Test User',
        age: 25,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.create('test_table', testData);
      await client.update('test_table', '1', { age: 26 });
      const result = await client.findById<TestEntity>('test_table', '1');

      expect(result?.age).toBe(26);
    });

    it('should delete a record', async () => {
      const testData: TestEntity = {
        id: '1',
        name: 'Test User',
        age: 25,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.create('test_table', testData);
      await client.delete('test_table', '1');
      const result = await client.findById<TestEntity>('test_table', '1');

      expect(result).toBeNull();
    });
  });

  describe('Query Operations', () => {
    it('should find all records with filter', async () => {
      const testData: TestEntity[] = [
        {
          id: '1',
          name: 'Test User 1',
          age: 25,
          email: 'test1@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Test User 2',
          age: 30,
          email: 'test2@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const data of testData) {
        await client.create('test_table', data);
      }

      const results = await client.findAll<TestEntity>('test_table', { age: 25 });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Test User 1');
    });

    it('should query with options', async () => {
      const testData: TestEntity[] = [
        {
          id: '1',
          name: 'Test User 1',
          age: 25,
          email: 'test1@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Test User 2',
          age: 30,
          email: 'test2@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          name: 'Test User 3',
          age: 35,
          email: 'test3@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const data of testData) {
        await client.create('test_table', data);
      }

      const options: QueryOptions = {
        where: { age: { $gt: 25 } },
        orderBy: ['age', 'DESC'],
        limit: 2,
        offset: 0
      };

      const result = await client.query<TestEntity>('test_table', options);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(result.data[0].age).toBe(35);
      expect(result.data[1].age).toBe(30);
    });
  });

  describe('Batch Operations', () => {
    it('should execute batch operations', async () => {
      const operations: BatchOperation<TestEntity>[] = [
        {
          type: 'add',
          data: {
            id: '1',
            name: 'Test User 1',
            age: 25,
            email: 'test1@example.com',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        {
          type: 'add',
          data: {
            id: '2',
            name: 'Test User 2',
            age: 30,
            email: 'test2@example.com',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        {
          type: 'put',
          data: {
            id: '1',
            name: 'Updated User 1',
            age: 26,
            email: 'test1@example.com',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        {
          type: 'delete',
          data: {
            id: '2',
            name: 'Test User 2',
            age: 30,
            email: 'test2@example.com',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      ];

      await client.batch('test_table', operations);

      const result1 = await client.findById<TestEntity>('test_table', '1');
      expect(result1?.name).toBe('Updated User 1');
      expect(result1?.age).toBe(26);

      const result2 = await client.findById<TestEntity>('test_table', '2');
      expect(result2).toBeNull();
    });
  });

  describe('Transaction Support', () => {
    it('should rollback on error', async () => {
      const testData: TestEntity = {
        id: '1',
        name: 'Test User',
        age: 25,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      try {
        await client.transaction(async (tx) => {
          await client.create('test_table', testData);
          throw new Error('Test error');
        });
      } catch (error) {
        // Expected error
      }

      const result = await client.findById<TestEntity>('test_table', '1');
      expect(result).toBeNull();
    });

    it('should commit on success', async () => {
      const testData: TestEntity = {
        id: '1',
        name: 'Test User',
        age: 25,
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await client.transaction(async (tx) => {
        await client.create('test_table', testData);
      });

      const result = await client.findById<TestEntity>('test_table', '1');
      expect(result).toEqual(testData);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const invalidData = {
        id: '1',
        name: 'Test User',
        // Missing required fields
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await expect(client.create('test_table', invalidData as any)).rejects.toThrow();
    });

    it('should handle connection errors', async () => {
      await client.close();
      await expect(client.findById('test_table', '1')).rejects.toThrow('Database not initialized');
    });
  });
}); 