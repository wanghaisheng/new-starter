import { FirebaseClient } from '@db/clients/firebase/firebase-client';
import { IndexedDBClient } from '@db/clients/indexeddb/indexeddb-client';
import { BaseEntity } from '@db/types/base-entity';
import { DatabaseConfig } from '@db/interfaces';
import { faker } from '@faker-js/faker';

export interface Operation {
  type: 'create' | 'update' | 'delete' | 'query';
  duration: number;
  success: boolean;
  offline?: boolean;
}

export interface SimulatorConfig {
  firebaseClient: FirebaseClient;
  indexedDBClient: IndexedDBClient;
  concurrentUsers?: number;
  operationsPerUser?: number;
  networkLatency?: number;
  networkDisconnectProbability?: number;
  operationInterval?: number;
}

interface NetworkConditions {
  latency: number;
  jitter: number;
  packetLoss: number;
}

interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  errorRate: number;
}

interface MemoryMetrics {
  trend: number;
  peak: number;
  average: number;
}

interface SyncResult {
  consistent: boolean;
  syncTime: number;
}

interface UserSession {
  userId: string;
  deviceId: string;
  lastActive: Date;
}

export class UserSimulator {
  private firebaseClient: FirebaseClient;
  private indexedDBClient: IndexedDBClient;
  private config: SimulatorConfig;
  private operations: Operation[] = [];
  private activeSessions: Map<string, UserSession[]>;
  private startTime: number;

  constructor(config: SimulatorConfig) {
    this.firebaseClient = config.firebaseClient;
    this.indexedDBClient = config.indexedDBClient;
    this.activeSessions = new Map();
    this.startTime = Date.now();
    this.config = {
      concurrentUsers: config.concurrentUsers || 10,
      operationsPerUser: config.operationsPerUser || 100,
      networkLatency: config.networkLatency || 0,
      networkDisconnectProbability: config.networkDisconnectProbability || 0,
      operationInterval: config.operationInterval || 1000,
      ...config
    };
  }

  async initialize(): Promise<void> {
    await this.firebaseClient.initialize();
    await this.indexedDBClient.initialize();
  }

  async cleanup(): Promise<void> {
    await this.firebaseClient.clear();
    await this.indexedDBClient.clear();
    this.operations = [];
    this.activeSessions.clear();
  }

  getOperations(): Operation[] {
    return this.operations;
  }

  async simulateConcurrentUsers(): Promise<void> {
    const users = Array.from({ length: this.config.concurrentUsers! }, (_, i) => i);
    await Promise.all(users.map(() => this.simulateUserOperations()));
  }

  private async simulateUserOperations(): Promise<void> {
    for (let i = 0; i < this.config.operationsPerUser!; i++) {
      const operation = await this.performRandomOperation();
      this.operations.push(operation);
      await this.applyNetworkConditions();
    }
  }

  private async performRandomOperation(): Promise<Operation> {
    const start = Date.now();
    const type = this.getRandomOperationType();
    let success = true;
    let offline = false;

    try {
      switch (type) {
        case 'create':
          await this.createRandomEntity();
          break;
        case 'update':
          await this.updateRandomEntity();
          break;
        case 'delete':
          await this.deleteRandomEntity();
          break;
        case 'query':
          await this.queryEntities();
          break;
      }
    } catch (error) {
      success = false;
      console.error(`Operation failed: ${type}`, error);
    }

    return {
      type,
      duration: Date.now() - start,
      success,
      offline
    };
  }

  private getRandomOperationType(): Operation['type'] {
    const types: Operation['type'][] = ['create', 'update', 'delete', 'query'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private async applyNetworkConditions(): Promise<void> {
    if (this.config.networkLatency) {
      await new Promise(resolve => setTimeout(resolve, this.config.networkLatency));
    }

    if (this.config.networkDisconnectProbability && Math.random() < this.config.networkDisconnectProbability) {
      // Simulate network disconnection
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async createRandomEntity(): Promise<void> {
    const entity = this.generateRandomEntity();
    await this.firebaseClient.create('test_entities', entity);
    await this.indexedDBClient.create('test_entities', entity);
  }

  private async updateRandomEntity(): Promise<void> {
    const entities = await this.firebaseClient.findAll('test_entities');
    if (entities.length === 0) return;

    const entity = entities[Math.floor(Math.random() * entities.length)];
    const updates = this.generateRandomUpdates();

    await this.firebaseClient.update('test_entities', entity.id, updates);
    await this.indexedDBClient.update('test_entities', entity.id, updates);
  }

  private async deleteRandomEntity(): Promise<void> {
    const entities = await this.firebaseClient.findAll('test_entities');
    if (entities.length === 0) return;

    const entity = entities[Math.floor(Math.random() * entities.length)];
    await this.firebaseClient.delete('test_entities', entity.id);
    await this.indexedDBClient.delete('test_entities', entity.id);
  }

  private async queryEntities(): Promise<void> {
    await this.firebaseClient.findAll('test_entities');
    await this.indexedDBClient.findAll('test_entities');
  }

  private generateRandomEntity(): BaseEntity {
    return {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private generateRandomUpdates(): Partial<BaseEntity> {
    return {
      updatedAt: new Date()
    };
  }

  async simulateFrequentOperations(count: number): Promise<Operation[]> {
    const operations: Operation[] = [];
    for (let i = 0; i < count; i++) {
      const operation = await this.performRandomOperation();
      operations.push(operation);
      await this.delay(this.config.operationInterval ?? 100);
    }
    return operations;
  }

  async simulateNetworkConditions(conditions: NetworkConditions): Promise<Operation[]> {
    const operations: Operation[] = [];
    const { latency, jitter, packetLoss } = conditions;

    for (let i = 0; i < 100; i++) {
      if (Math.random() < packetLoss) {
        operations.push({
          type: 'query',
          duration: 0,
          success: false,
          offline: true
        });
        continue;
      }

      const delay = latency + (Math.random() * 2 - 1) * jitter;
      await this.delay(delay);

      const operation = await this.performRandomOperation();
      operations.push(operation);
    }

    return operations;
  }

  async simulateNetworkDisconnection(): Promise<Operation[]> {
    const operations: Operation[] = [];
    
    // 模拟网络断开
    await this.delay(1000);
    operations.push({
      type: 'query',
      duration: 0,
      success: false,
      offline: true
    });

    // 执行离线操作
    for (let i = 0; i < 10; i++) {
      const operation = await this.performRandomOperation();
      operations.push({
        ...operation,
        offline: true
      });
      await this.delay(100);
    }

    // 模拟网络恢复
    await this.delay(1000);
    const syncStart = Date.now();
    await this.verifyDataSync();
    const syncEnd = Date.now();

    operations.push({
      type: 'query',
      duration: syncEnd - syncStart,
      success: true
    });

    return operations;
  }

  async simulateMultiDeviceLogin(deviceCount: number): Promise<Operation[]> {
    const operations: Operation[] = [];
    const userId = faker.string.uuid();

    for (let i = 0; i < deviceCount; i++) {
      const deviceId = faker.string.uuid();
      const session: UserSession = {
        userId,
        deviceId,
        lastActive: new Date()
      };

      const startTime = Date.now();
      await this.createSession(session);
      const endTime = Date.now();

      operations.push({
        type: 'create',
        duration: endTime - startTime,
        success: true
      });
    }

    return operations;
  }

  async simulateDeviceSwitching(switchCount: number): Promise<Operation[]> {
    const operations: Operation[] = [];
    const userId = faker.string.uuid();
    const deviceId = faker.string.uuid();

    for (let i = 0; i < switchCount; i++) {
      const startTime = Date.now();
      await this.switchDevice(userId, deviceId);
      const endTime = Date.now();

      operations.push({
        type: 'update',
        duration: endTime - startTime,
        success: true
      });

      await this.delay(100);
    }

    return operations;
  }

  async simulateLongRunning(duration: number): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const endTime = startTime + duration;
    let errorCount = 0;
    let operationCount = 0;

    while (Date.now() < endTime) {
      try {
        await this.performRandomOperation();
        operationCount++;
      } catch (error) {
        errorCount++;
      }

      await this.delay(100);
    }

    return {
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user / 1000000,
      errorRate: errorCount / (operationCount + errorCount)
    };
  }

  async monitorMemoryUsage(duration: number): Promise<MemoryMetrics> {
    const startTime = Date.now();
    const endTime = startTime + duration;
    const measurements: number[] = [];

    while (Date.now() < endTime) {
      measurements.push(process.memoryUsage().heapUsed);
      await this.delay(1000);
    }

    const trend = (measurements[measurements.length - 1] - measurements[0]) / duration;
    const peak = Math.max(...measurements);
    const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;

    return { trend, peak, average };
  }

  async getActiveSessions(): Promise<UserSession[]> {
    const sessions: UserSession[] = [];
    this.activeSessions.forEach(userSessions => {
      sessions.push(...userSessions);
    });
    return sessions;
  }

  async verifyDataSync(): Promise<SyncResult> {
    const startTime = Date.now();
    
    const firebaseData = await this.firebaseClient.findAll('test_entities');
    const indexedDBData = await this.indexedDBClient.findAll('test_entities');

    const firebaseIds = new Set(firebaseData.map((item: unknown) => (item as BaseEntity).id));
    const indexedDBIds = new Set(indexedDBData.map((item: unknown) => (item as BaseEntity).id));

    const consistent = 
      firebaseIds.size === indexedDBIds.size &&
      Array.from(firebaseIds).every(id => indexedDBIds.has(id));

    return {
      consistent,
      syncTime: Date.now() - startTime
    };
  }

  private async createSession(session: UserSession): Promise<void> {
    const userSessions = this.activeSessions.get(session.userId) || [];
    userSessions.push(session);
    this.activeSessions.set(session.userId, userSessions);
  }

  private async switchDevice(userId: string, deviceId: string): Promise<void> {
    const userSessions = this.activeSessions.get(userId) || [];
    const session = userSessions.find(s => s.deviceId === deviceId);
    if (session) {
      session.lastActive = new Date();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 