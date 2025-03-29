import { MockIndexedDBClient } from '../../../clients/mock/indexeddb-client';
import { v4 as uuidv4 } from 'uuid';
import { IDBPTransaction } from 'idb';

describe('Mock IndexedDB Client Performance Tests', () => {
  let client: MockIndexedDBClient;
  const testDbName = 'performance_test_db';
  const BATCH_SIZE = 1000;

  beforeAll(async () => {
    client = new MockIndexedDBClient(testDbName);
    await client.initialize();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await client.clear();
  });

  describe('Bulk Operations', () => {
    it('should handle bulk creation efficiently', async () => {
      const startTime = performance.now();
      const users = Array.from({ length: BATCH_SIZE }, (_, i) => ({
        id: uuidv4(),
        name: `User ${i}`,
        email: `user${i}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await Promise.all(users.map(user => client.create('users', user)));
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`Bulk creation of ${BATCH_SIZE} users took ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle bulk retrieval efficiently', async () => {
      // Create test data
      const users = Array.from({ length: BATCH_SIZE }, (_, i) => ({
        id: uuidv4(),
        name: `User ${i}`,
        email: `user${i}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await Promise.all(users.map(user => client.create('users', user)));

      // Test bulk retrieval
      const startTime = performance.now();
      const retrievedUsers = await client.findAll('users');
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`Bulk retrieval of ${BATCH_SIZE} users took ${duration}ms`);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(retrievedUsers).toHaveLength(BATCH_SIZE);
    });
  });

  describe('Query Performance', () => {
    beforeEach(async () => {
      // Create test data
      const users = Array.from({ length: BATCH_SIZE }, (_, i) => ({
        id: uuidv4(),
        name: `User ${i}`,
        email: `user${i}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await Promise.all(users.map(user => client.create('users', user)));
    });

    it('should handle filtered queries efficiently', async () => {
      const startTime = performance.now();
      const users = await client.query('users', {
        where: { name: 'User 0' }
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`Filtered query took ${duration}ms`);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
      expect(users).toHaveLength(1);
    });

    it('should handle sorted queries efficiently', async () => {
      const startTime = performance.now();
      const users = await client.query('users', {
        orderBy: 'name',
        limit: 100
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`Sorted query with limit took ${duration}ms`);
      expect(duration).toBeLessThan(200); // Should complete within 200ms
      expect(users).toHaveLength(100);
    });
  });

  describe('Transaction Performance', () => {
    it('should handle large transactions efficiently', async () => {
      const startTime = performance.now();
      await client.transaction(async (tx: IDBPTransaction) => {
        const users = Array.from({ length: BATCH_SIZE }, (_, i) => ({
          id: uuidv4(),
          name: `User ${i}`,
          email: `user${i}@example.com`,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        await Promise.all(users.map(user => client.create('users', user)));
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`Large transaction took ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify transaction was committed
      const count = await client.count('users');
      expect(count).toBe(BATCH_SIZE);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent reads efficiently', async () => {
      // Create test data
      const users = Array.from({ length: BATCH_SIZE }, (_, i) => ({
        id: uuidv4(),
        name: `User ${i}`,
        email: `user${i}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await Promise.all(users.map(user => client.create('users', user)));

      // Test concurrent reads
      const startTime = performance.now();
      const readPromises = Array.from({ length: 10 }, () => client.findAll('users'));
      await Promise.all(readPromises);
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`10 concurrent reads took ${duration}ms`);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle concurrent writes efficiently', async () => {
      const startTime = performance.now();
      const writePromises = Array.from({ length: 10 }, (_, i) => {
        const user = {
          id: uuidv4(),
          name: `Concurrent User ${i}`,
          email: `concurrent${i}@example.com`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return client.create('users', user);
      });

      await Promise.all(writePromises);
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`10 concurrent writes took ${duration}ms`);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      // Verify all writes were successful
      const count = await client.count('users');
      expect(count).toBe(10);
    });
  });
}); 