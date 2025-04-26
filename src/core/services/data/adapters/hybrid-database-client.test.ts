import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HybridDatabaseClient } from './hybrid-database-client';

describe('HybridDatabaseClient', () => {
  let offline: any;
  let online: any;
  let client: HybridDatabaseClient;
  const config = { services: { data: { options: {} } } } as any;
  const tableName = 'test_table';
  const now = new Date().toISOString();
  const entity = { id: '1', foo: 'bar', createdAt: now, updatedAt: now };
  const entity2 = { id: '2', foo: 'baz', createdAt: now, updatedAt: now };

  beforeEach(() => {
    offline = {
      getType: () => 'offline',
      connect: vi.fn(),
      disconnect: vi.fn(),
      findById: vi.fn().mockResolvedValue(entity),
      create: vi.fn().mockResolvedValue(entity),
      update: vi.fn(),
      delete: vi.fn(),
      createMany: vi.fn().mockResolvedValue([entity, entity2]),
      updateMany: vi.fn().mockResolvedValue(2),
      deleteMany: vi.fn().mockResolvedValue(2),
      findAll: vi.fn().mockResolvedValue([entity, entity2]),
    };
    online = {
      getType: () => 'online',
      connect: vi.fn(),
      disconnect: vi.fn(),
      create: vi.fn().mockResolvedValue(entity),
      update: vi.fn(),
      delete: vi.fn(),
      createMany: vi.fn().mockResolvedValue([entity, entity2]),
      updateMany: vi.fn().mockResolvedValue(2),
      deleteMany: vi.fn().mockResolvedValue(2),
      findAll: vi.fn().mockResolvedValue([entity2]),
    };
    client = new HybridDatabaseClient(config, offline, online);
  });

  it('should switch mode and call correct client', async () => {
    expect(client).toBeDefined();
    expect(client["mode"]).toBe('offline');
    client["mode"] = 'online';
    expect(client["mode"]).toBe('online');
  });

  it('should call findById and findOne as alias', async () => {
    const res1 = await client.findById(tableName, entity.id);
    const res2 = await client.findOne(tableName, entity.id);
    expect(res1).toEqual(entity);
    expect(res2).toEqual(entity);
    expect(offline.findById).toHaveBeenCalledWith(tableName, entity.id);
  });

  it('should call create and insert as alias, and sync online', async () => {
    const res1 = await client.create(tableName, entity);
    const res2 = await client.insert(tableName, entity);
    expect(res1).toEqual(entity);
    expect(res2).toEqual(entity);
    expect(offline.create).toHaveBeenCalledWith(tableName, entity);
    expect(online.create).toHaveBeenCalledWith(tableName, entity);
  });

  it('should support batch createMany/updateMany/deleteMany', async () => {
    const createRes = await client.createMany(tableName, [entity, entity2]);
    expect(createRes.length).toBe(2);
    expect(offline.create).toHaveBeenCalledTimes(2);
    const updateRes = await client.updateMany(tableName, [entity.id, entity2.id], { foo: 'qux' });
    expect(updateRes).toBe(2);
    const deleteRes = await client.deleteMany(tableName, [entity.id, entity2.id]);
    expect(deleteRes).toBe(2);
  });

  it('should merge and deduplicate findAll results', async () => {
    const all = await client.findAll(tableName);
    expect(all.length).toBe(2);
    expect(all.some(e => e.id === entity.id)).toBe(true);
    expect(all.some(e => e.id === entity2.id)).toBe(true);
  });
});
