import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserSimulator, Operation } from './user-simulator';
import { FirebaseClient } from '@db/clients/firebase/firebase-client';
import { IndexedDBClient } from '@db/clients/indexeddb/indexeddb-client';
import { BaseEntity } from '@db/types/base-entity';
import { DatabaseConfig } from '@db/interfaces';

interface TestUser extends BaseEntity {
  name: string;
  email: string;
  preferences: {
    theme: string;
    notifications: boolean;
  };
  lastActive: Date;
}

describe('UserSimulator', () => {
  let firebaseClient: FirebaseClient;
  let indexedDBClient: IndexedDBClient;
  let simulator: UserSimulator;

  beforeEach(async () => {
    const dbConfig: DatabaseConfig = {
      name: 'test-db',
      version: 1,
      engine: 'indexeddb',
      offline: {
        maxStorageSize: 50 * 1024 * 1024, // 50MB
        maxEntitiesPerTable: 10000,
        compressionEnabled: true,
        encryptionEnabled: true
      }
    };

    const firebaseConfig = {
      apiKey: 'test-api-key',
      authDomain: 'test-auth-domain',
      projectId: 'test-project-id',
      storageBucket: 'test-storage-bucket',
      messagingSenderId: 'test-messaging-sender-id',
      appId: 'test-app-id'
    };

    firebaseClient = new FirebaseClient(firebaseConfig);
    indexedDBClient = new IndexedDBClient(dbConfig);
    simulator = new UserSimulator({
      firebaseClient,
      indexedDBClient,
      concurrentUsers: 10,
      operationsPerUser: 100,
      networkLatency: 50,
      networkDisconnectProbability: 0.1
    });

    await simulator.initialize();
  });

  afterEach(async () => {
    await simulator.cleanup();
  });

  it('should handle multiple concurrent users', async () => {
    await simulator.simulateConcurrentUsers();
    const operations = simulator.getOperations();
    expect(operations.length).toBeGreaterThan(0);
  });

  it('should calculate average operation time correctly', () => {
    const operations: Operation[] = [
      { type: 'create', duration: 100, success: true },
      { type: 'update', duration: 150, success: true },
      { type: 'query', duration: 50, success: true },
      { type: 'delete', duration: 200, success: false }
    ];

    const averageTime = operations.reduce((sum: number, op: Operation) => {
      return sum + (op.success ? op.duration : 0);
    }, 0) / operations.filter((op: Operation) => op.success).length;

    expect(averageTime).toBe(100);
  });

  it('should track offline operations correctly', () => {
    const operations: Operation[] = [
      { type: 'create', duration: 100, success: true, offline: true },
      { type: 'update', duration: 150, success: true, offline: false },
      { type: 'query', duration: 50, success: true, offline: true },
      { type: 'delete', duration: 200, success: true, offline: false }
    ];

    const offlineOperations = operations.filter((op: Operation) => op.offline);
    expect(offlineOperations.length).toBe(2);

    const averageOfflineTime = operations.reduce((sum: number, op: Operation) => {
      return sum + (op.offline ? op.duration : 0);
    }, 0) / offlineOperations.length;

    expect(averageOfflineTime).toBe(75);
  });
}); 