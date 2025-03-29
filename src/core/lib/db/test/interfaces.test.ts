import { describe, it, expect } from 'vitest';
import {
  DatabaseEngine,
  SyncStrategy,
  SyncStatus,
  SyncConfig,
  HybridDatabaseConfig,
  DatabaseConfig,
  IBaseDatabaseClient,
  IDatabaseClient,
  ISyncClient,
  IDatabaseTransaction,
  QueryOptions
} from '../../interfaces';
import { BaseEntity, User, Match, Message } from '../../types';

describe('Database Interfaces', () => {
  // 测试 SyncConfig 接口
  it('should have valid sync config structure', () => {
    const config: SyncConfig = {
      enabled: true,
      strategy: 'immediate',
      interval: 5000,
      retryAttempts: 3,
      retryDelay: 1000,
      conflictResolution: 'last-write-wins'
    };
    expect(config).toHaveProperty('enabled');
    expect(config).toHaveProperty('strategy');
    expect(['immediate', 'periodic', 'manual']).toContain(config.strategy);
  });

  // 测试 HybridDatabaseConfig 接口
  it('should have valid hybrid database config structure', () => {
    const config: HybridDatabaseConfig = {
      engine: 'sqlite',
      sync: {
        enabled: true,
        strategy: 'immediate'
      },
      offline: {
        maxStorageSize: 1024 * 1024,
        maxEntitiesPerTable: 1000,
        compressionEnabled: true,
        encryptionEnabled: true
      }
    };
    expect(config).toHaveProperty('engine');
    expect(config).toHaveProperty('sync');
    expect(config).toHaveProperty('offline');
  });

  // 测试 IBaseDatabaseClient 接口
  it('should have required base database client methods', () => {
    const client: IBaseDatabaseClient = {
      initialize: async () => {},
      close: async () => {},
      clear: async () => {},
      findById: async () => null,
      findAll: async () => [],
      create: async () => ({ id: '1', createdAt: new Date(), updatedAt: new Date() } as BaseEntity),
      update: async () => {},
      delete: async () => {},
      query: async () => ({ data: [], total: 0, hasMore: false }),
      count: async () => 0,
      beginTransaction: async () => {},
      commitTransaction: async () => {},
      rollbackTransaction: async () => {},
      batch: async () => {},
      executeRawQuery: async () => []
    };

    expect(typeof client.initialize).toBe('function');
    expect(typeof client.close).toBe('function');
    expect(typeof client.clear).toBe('function');
    expect(typeof client.findById).toBe('function');
    expect(typeof client.findAll).toBe('function');
    expect(typeof client.create).toBe('function');
    expect(typeof client.update).toBe('function');
    expect(typeof client.delete).toBe('function');
    expect(typeof client.query).toBe('function');
    expect(typeof client.count).toBe('function');
    expect(typeof client.beginTransaction).toBe('function');
    expect(typeof client.commitTransaction).toBe('function');
    expect(typeof client.rollbackTransaction).toBe('function');
    expect(typeof client.batch).toBe('function');
    expect(typeof client.executeRawQuery).toBe('function');
  });

  // 测试 IDatabaseClient 接口
  it('should have required database client methods', () => {
    const client: IDatabaseClient = {
      // IBaseDatabaseClient methods
      initialize: async () => {},
      close: async () => {},
      clear: async () => {},
      findById: async () => null,
      findAll: async () => [],
      create: async () => ({ id: '1', createdAt: new Date(), updatedAt: new Date() } as BaseEntity),
      update: async () => {},
      delete: async () => {},
      query: async () => ({ data: [], total: 0, hasMore: false }),
      count: async () => 0,
      beginTransaction: async () => {},
      commitTransaction: async () => {},
      rollbackTransaction: async () => {},
      batch: async () => {},
      executeRawQuery: async () => [],

      // IDatabaseClient specific methods
      findUsers: async () => [],
      findMatches: async () => [],
      findMessages: async () => [],
      createUser: async () => ({ id: '1', createdAt: new Date(), updatedAt: new Date(), name: '', email: '' } as User),
      createMatch: async () => ({ id: '1', createdAt: new Date(), updatedAt: new Date(), userId: '', matchedUserId: '', status: '' } as Match),
      createMessage: async () => ({ id: '1', createdAt: new Date(), updatedAt: new Date(), senderId: '', receiverId: '', content: '', status: '' } as Message),
      updateUser: async () => {},
      updateMatch: async () => {},
      updateMessage: async () => {},
      deleteUser: async () => {},
      deleteMatch: async () => {},
      deleteMessage: async () => {},
      transaction: async () => ({})
    };

    expect(typeof client.findUsers).toBe('function');
    expect(typeof client.findMatches).toBe('function');
    expect(typeof client.findMessages).toBe('function');
    expect(typeof client.createUser).toBe('function');
    expect(typeof client.createMatch).toBe('function');
    expect(typeof client.createMessage).toBe('function');
    expect(typeof client.updateUser).toBe('function');
    expect(typeof client.updateMatch).toBe('function');
    expect(typeof client.updateMessage).toBe('function');
    expect(typeof client.deleteUser).toBe('function');
    expect(typeof client.deleteMatch).toBe('function');
    expect(typeof client.deleteMessage).toBe('function');
    expect(typeof client.transaction).toBe('function');
  });

  // 测试 ISyncClient 接口
  it('should have required sync client methods', () => {
    const client: ISyncClient = {
      // IDatabaseClient methods
      initialize: async () => {},
      close: async () => {},
      clear: async () => {},
      findById: async () => null,
      findAll: async () => [],
      create: async () => ({ id: '1', createdAt: new Date(), updatedAt: new Date() } as BaseEntity),
      update: async () => {},
      delete: async () => {},
      query: async () => ({ data: [], total: 0, hasMore: false }),
      count: async () => 0,
      beginTransaction: async () => {},
      commitTransaction: async () => {},
      rollbackTransaction: async () => {},
      batch: async () => {},
      executeRawQuery: async () => [],
      findUsers: async () => [],
      findMatches: async () => [],
      findMessages: async () => [],
      createUser: async () => ({ id: '1', createdAt: new Date(), updatedAt: new Date(), name: '', email: '' } as User),
      createMatch: async () => ({ id: '1', createdAt: new Date(), updatedAt: new Date(), userId: '', matchedUserId: '', status: '' } as Match),
      createMessage: async () => ({ id: '1', createdAt: new Date(), updatedAt: new Date(), senderId: '', receiverId: '', content: '', status: '' } as Message),
      updateUser: async () => {},
      updateMatch: async () => {},
      updateMessage: async () => {},
      deleteUser: async () => {},
      deleteMatch: async () => {},
      deleteMessage: async () => {},
      transaction: async () => ({}),

      // ISyncClient specific methods
      sync: async () => {},
      getSyncStatus: async () => 'pending',
      cancelSync: async () => {}
    };

    expect(typeof client.sync).toBe('function');
    expect(typeof client.getSyncStatus).toBe('function');
    expect(typeof client.cancelSync).toBe('function');
  });
}); 