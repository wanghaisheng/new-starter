import { describe, it, expect, vi } from 'vitest';
import { BaseDatabaseClient } from './base-database-client';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';

describe('BaseDatabaseClient', () => {
  class TestClient extends BaseDatabaseClient<BaseEntity> {
    async connect() {}
    async disconnect() {}
    async clear() {}
    async findById() { return null; }
    async query() { return { items: [], total: 0 }; }
    async create() { return { id: '1', createdAt: '', updatedAt: '' }; }
    async update() {}
    async delete() {}
    async beginTransaction() {}
    async commitTransaction() {}
    async rollbackTransaction() {}
    async batch() {}
    async executeRawQuery() { return []; }
    getType() { return 'test'; }
    isInitialized() { return true; }
    getConfig() { return {}; }
    async initialize() {}
    async createMany(tableName: string, data: BaseEntity[]) { return data; }
    async updateMany(tableName: string, ids: string[], updates: Partial<BaseEntity>) { return ids.length; }
    async deleteMany(tableName: string, ids: string[]) { return ids.length; }
    async findAll(tableName: string, filter?: Record<string, any>) { return []; }
    async get(key: string) { return (this as any)._cache?.[key]; }
    async set(key: string, value: any) {
      if (!(this as any)._cache) (this as any)._cache = {};
      (this as any)._cache[key] = value;
    }
    public async cacheClear() { if ((this as any)._cache) (this as any)._cache = {}; }
    async count() { return 0; }
    async close() {}
  }
  it('should cache set/get', async () => {
    const client = new TestClient();
    await client.set('k', 123);
    expect(await client.get('k')).toBe(123);
  });
  it('should clear cache', async () => {
    const client = new TestClient();
    await client.set('k', 1);
    await client.cacheClear();
    expect(await client.get('k')).toBeUndefined();
  });
  it('should support batch methods', async () => {
    const client = new TestClient();
    const now = new Date().toISOString();
    const entities: BaseEntity[] = [
      { id: '1', createdAt: now, updatedAt: now },
      { id: '2', createdAt: now, updatedAt: now },
    ];
    expect(await client.createMany('t', entities)).toEqual(entities);
    expect(await client.updateMany('t', ['1', '2'], { foo: 'bar' })).toBe(2);
    expect(await client.deleteMany('t', ['1', '2'])).toBe(2);
    expect(await client.findAll('t')).toEqual([]);
  });
});
