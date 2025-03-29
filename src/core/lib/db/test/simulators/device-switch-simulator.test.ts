import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserSimulator } from './user-simulator';
import { FirebaseClient } from '@/core/lib/db/clients/firebase/firebase-client';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { DatabaseConfig, DatabaseEngine } from '@/core/lib/db/interfaces';
import { UserSession } from '@/core/lib/db/types/simulator';
import { faker } from '@faker-js/faker';

describe('Device Switch Simulator Tests', () => {
  let firebaseClient: FirebaseClient;
  let indexedDBClient: IndexedDBClient;
  let simulator: UserSimulator;

  beforeEach(async () => {
    const dbConfig: DatabaseConfig = {
      name: 'test-db',
      version: 1,
      engine: 'indexeddb' as DatabaseEngine,
      offline: {
        maxStorageSize: 50 * 1024 * 1024, // 50MB
        maxEntitiesPerTable: 10000,
        compressionEnabled: true,
        encryptionEnabled: true
      },
      schema: [
        {
          name: 'userSessions',
          columns: [
            { name: 'id', type: 'string', primaryKey: true },
            { name: 'userId', type: 'string' },
            { name: 'deviceId', type: 'string' },
            { name: 'lastActive', type: 'date' }
          ],
          indexes: [
            { name: 'userId_idx', columns: ['userId'] },
            { name: 'deviceId_idx', columns: ['deviceId'] }
          ]
        },
        {
          name: 'entities',
          columns: [
            { name: 'id', type: 'string', primaryKey: true },
            { name: 'userId', type: 'string' },
            { name: 'createdAt', type: 'date' },
            { name: 'updatedAt', type: 'date' }
          ],
          indexes: [
            { name: 'userId_idx', columns: ['userId'] }
          ]
        }
      ]
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

  describe('Multi-device Login', () => {
    it('should handle multiple device logins for the same user', async () => {
      const deviceCount = 3;
      const operations = await simulator.simulateMultiDeviceLogin(deviceCount);
      
      expect(operations.length).toBe(deviceCount);
      expect(operations.every(op => op.success)).toBe(true);
      expect(operations.every(op => op.type === 'create')).toBe(true);
    });

    it('should maintain session consistency across devices', async () => {
      const deviceCount = 2;
      const userId = faker.string.uuid();
      
      // 模拟多设备登录
      await simulator.simulateMultiDeviceLogin(deviceCount);
      
      // 验证会话同步
      const sessions = await firebaseClient.findAll('userSessions');
      const userSessions = sessions.filter(s => ((s as unknown) as UserSession).userId === userId);
      expect(userSessions.length).toBe(deviceCount);
    });
  });

  describe('Device Switching', () => {
    it('should handle device switching with data sync', async () => {
      const switchCount = 5;
      const operations = await simulator.simulateDeviceSwitching(switchCount);
      
      expect(operations.length).toBe(switchCount);
      expect(operations.every(op => op.success)).toBe(true);
      expect(operations.every(op => op.type === 'update')).toBe(true);
    });

    it('should maintain data consistency during device switch', async () => {
      const userId = faker.string.uuid();
      const deviceId = faker.string.uuid();
      
      // 模拟设备切换
      await simulator.simulateDeviceSwitching(3);
      
      // 验证数据一致性
      const sessions = await firebaseClient.findAll('userSessions');
      const userSessions = sessions.filter(s => ((s as unknown) as UserSession).userId === userId);
      expect(userSessions.length).toBe(1);
      expect(((userSessions[0] as unknown) as UserSession).deviceId).toBe(deviceId);
    });
  });

  describe('Session Synchronization', () => {
    it('should sync session data between devices', async () => {
      const userId = faker.string.uuid();
      const device1Id = faker.string.uuid();
      const device2Id = faker.string.uuid();
      
      // 创建两个设备会话
      await simulator.simulateMultiDeviceLogin(2);
      
      // 模拟设备切换
      await simulator.simulateDeviceSwitching(2);
      
      // 验证会话同步
      const sessions = await firebaseClient.findAll('userSessions');
      const userSessions = sessions.filter(s => ((s as unknown) as UserSession).userId === userId);
      expect(userSessions.length).toBe(2);
      expect(userSessions.map(s => ((s as unknown) as UserSession).deviceId)).toContain(device1Id);
      expect(userSessions.map(s => ((s as unknown) as UserSession).deviceId)).toContain(device2Id);
    });

    it('should handle offline session updates', async () => {
      // 模拟网络断开
      await simulator.simulateNetworkDisconnection();
      
      // 模拟设备切换
      await simulator.simulateDeviceSwitching(2);
      
      // 验证离线数据同步
      const operations = await simulator.simulateNetworkDisconnection();
      expect(operations.some(op => op.offline)).toBe(true);
      expect(operations.some(op => op.type === 'query' && op.success)).toBe(true);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across device switches', async () => {
      const userId = faker.string.uuid();
      
      // 创建初始数据
      await simulator['createRandomEntity']();
      
      // 模拟多设备操作
      await simulator.simulateMultiDeviceLogin(2);
      await simulator.simulateDeviceSwitching(3);
      
      // 验证数据一致性
      const entities = await firebaseClient.findAll('entities');
      const userEntities = entities.filter(e => ((e as unknown) as { userId: string }).userId === userId);
      expect(userEntities.length).toBe(1);
    });

    it('should handle concurrent updates during device switch', async () => {
      const userId = faker.string.uuid();
      const deviceCount = 3;
      
      // 模拟多设备并发操作
      await simulator.simulateMultiDeviceLogin(deviceCount);
      
      // 模拟并发设备切换
      const switchPromises = Array(deviceCount).fill(null).map(() => 
        simulator.simulateDeviceSwitching(2)
      );
      
      await Promise.all(switchPromises);
      
      // 验证数据一致性
      const sessions = await firebaseClient.findAll('userSessions');
      const userSessions = sessions.filter(s => ((s as unknown) as UserSession).userId === userId);
      expect(userSessions.length).toBe(deviceCount);
    });
  });

  describe('Long-running Tests', () => {
    it('should maintain stability during 24-hour simulation', async () => {
      const startTime = Date.now();
      const endTime = startTime + 24 * 60 * 60 * 1000; // 24 hours
      const operations = [];
      
      while (Date.now() < endTime) {
        // 模拟随机设备切换
        const switchCount = Math.floor(Math.random() * 5) + 1;
        const switchOps = await simulator.simulateDeviceSwitching(switchCount);
        operations.push(...switchOps);
        
        // 每10分钟进行一次数据一致性检查
        if (operations.length % 60 === 0) {
          const sessions = await firebaseClient.findAll('userSessions');
          const entities = await firebaseClient.findAll('entities');
          expect(sessions.length).toBeGreaterThan(0);
          expect(entities.length).toBeGreaterThan(0);
        }
        
        // 模拟网络状态变化
        if (Math.random() < 0.1) {
          await simulator.simulateNetworkDisconnection();
        }
      }
      
      expect(operations.length).toBeGreaterThan(0);
      expect(operations.every(op => op.success)).toBe(true);
    });

    it('should not have memory leaks during long-running operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const operations = [];
      
      // 执行大量设备切换操作
      for (let i = 0; i < 1000; i++) {
        const switchOps = await simulator.simulateDeviceSwitching(2);
        operations.push(...switchOps);
        
        // 每100次操作检查一次内存使用
        if (i % 100 === 0) {
          const currentMemory = process.memoryUsage().heapUsed;
          const memoryIncrease = currentMemory - initialMemory;
          
          // 内存增长不应超过初始内存的50%
          expect(memoryIncrease / initialMemory).toBeLessThan(0.5);
        }
      }
    });

    it('should maintain performance during extended operations', async () => {
      const performanceMetrics = [];
      
      // 执行1000次设备切换操作
      for (let i = 0; i < 1000; i++) {
        const startTime = performance.now();
        await simulator.simulateDeviceSwitching(2);
        const endTime = performance.now();
        
        performanceMetrics.push(endTime - startTime);
        
        // 每100次操作检查性能
        if (i % 100 === 0) {
          const recentMetrics = performanceMetrics.slice(-100);
          const averageTime = recentMetrics.reduce((a, b) => a + b, 0) / recentMetrics.length;
          
          // 平均操作时间不应超过100ms
          expect(averageTime).toBeLessThan(100);
        }
      }
    });

    it('should maintain data consistency during long-running operations', async () => {
      const userId = faker.string.uuid();
      const initialData = simulator['generateRandomEntity']();
      
      // 创建实体
      await simulator['createRandomEntity']();
      
      // 执行1000次设备切换操作
      for (let i = 0; i < 1000; i++) {
        await simulator.simulateDeviceSwitching(2);
        
        // 每100次操作验证数据一致性
        if (i % 100 === 0) {
          const entities = await firebaseClient.findAll('entities');
          const userEntities = entities.filter(e => ((e as unknown) as { userId: string }).userId === userId);
          
          // 验证数据完整性
          expect(userEntities.length).toBe(1);
          expect(userEntities[0]).toMatchObject(initialData);
          
          // 验证会话数据一致性
          const sessions = await firebaseClient.findAll('userSessions');
          const userSessions = sessions.filter(s => ((s as unknown) as UserSession).userId === userId);
          expect(userSessions.length).toBeGreaterThan(0);
        }
      }
    });
  });
}); 