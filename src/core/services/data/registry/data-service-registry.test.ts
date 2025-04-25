import { describe, it, expect, vi } from 'vitest';
import { DataServiceRegistry } from './data-service-registry';
import type { IDataService } from '../types';
import type { QueryResult } from '@/core/lib/db/types/database';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';

type MockEntity = BaseEntity & { name: string };

function createMockEntity(): MockEntity {
  return {
    id: '1',
    name: 'mock',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('DataServiceRegistry', () => {
  class MockDataService implements IDataService<MockEntity> {
    connect = vi.fn(async () => {});
    disconnect = vi.fn(async () => {});
    clear = vi.fn(async () => {});
    findById = vi.fn(async () => null);
    query = vi.fn(async (tableName: string, options: any): Promise<QueryResult<MockEntity>> => ({
      items: [createMockEntity()],
      total: 1,
    }));
    create = vi.fn(async () => createMockEntity());
    update = vi.fn(async (tableName: string, id: string, data: Partial<MockEntity>) => {});
    delete = vi.fn(async () => {});
    beginTransaction = vi.fn(async () => {});
    commitTransaction = vi.fn(async () => {});
    rollbackTransaction = vi.fn(async () => {});
    batch = vi.fn(async () => {});
    executeRawQuery = vi.fn(async () => []);
    getType = vi.fn(() => 'mock');
    isInitialized = vi.fn(() => true);
    getConfig = vi.fn(() => ({}));
    initialize = vi.fn(async () => {});
    get = vi.fn(async () => createMockEntity());
    set = vi.fn(async () => {});
    dispose = vi.fn(async () => {});
    reset? = vi.fn(async () => {});
    checkHealth? = vi.fn(async () => ({ healthy: true }));
  }

  it('should register and get instance', () => {
    const key = 'mock1';
    const instance = new MockDataService();
    DataServiceRegistry.register(key, instance);
    const result = DataServiceRegistry.get(key);
    expect(result).toBe(instance);
  });

  it('should register and get factory', () => {
    const key = 'mock2';
    DataServiceRegistry.register(key, () => new MockDataService());
    const result = DataServiceRegistry.get(key);
    expect(result).toBeInstanceOf(MockDataService);
  });

  it('should unregister', () => {
    const key = 'mock3';
    DataServiceRegistry.register(key, () => new MockDataService());
    DataServiceRegistry.unregister(key);
    expect(DataServiceRegistry.get(key)).toBeUndefined();
  });

  it('should reset instance if reset implemented', async () => {
    const key = 'mock4';
    const instance = new MockDataService();
    DataServiceRegistry.register(key, instance);
    await DataServiceRegistry.reset(key);
    expect(instance.reset).toBeCalled();
  });

  it('should check health if checkHealth implemented', async () => {
    const key = 'mock5';
    const instance = new MockDataService();
    DataServiceRegistry.register(key, instance);
    const result = await DataServiceRegistry.checkHealth(key);
    expect(result.healthy).toBe(true);
  });

  it('should return unhealthy if checkHealth not implemented', async () => {
    const key = 'mock6';
    class NoHealthMock extends MockDataService {
      checkHealth = undefined;
    }
    const instance = new NoHealthMock();
    DataServiceRegistry.register(key, instance);
    const result = await DataServiceRegistry.checkHealth(key);
    expect(result.healthy).toBe(false);
  });
});
