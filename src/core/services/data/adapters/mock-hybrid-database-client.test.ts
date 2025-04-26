import { MockHybridDatabaseClient } from './mock-hybrid-database-client';
import type { BaseEntity } from '@/core/lib/db/types/base-entity';

describe('MockHybridDatabaseClient', () => {
  let client: MockHybridDatabaseClient;
  const tableName = 'test_table';
  const now = new Date().toISOString();
  const entity: BaseEntity = {
    id: '1',
    createdAt: now,
    updatedAt: now,
    foo: 'bar',
  };
  const entity2: BaseEntity = {
    id: '2',
    createdAt: now,
    updatedAt: now,
    foo: 'baz',
  };

  beforeEach(async () => {
    client = new MockHybridDatabaseClient({} as any);
    await client.initialize();
  });

  it('should insert and findOne entity', async () => {
    await client.insert(tableName, entity);
    const found = await client.findOne(tableName, entity.id);
    expect(found).toEqual(entity);
  });

  it('should create and findById entity', async () => {
    await client.create(tableName, entity);
    const found = await client.findById(tableName, entity.id);
    expect(found).toEqual(entity);
  });

  it('should query entities', async () => {
    await client.insert(tableName, entity);
    const res = await client.query(tableName, { where: { foo: 'bar' } });
    expect(res.items.length).toBe(1);
    expect(res.items[0]).toEqual(entity);
  });

  it('should update entity', async () => {
    await client.insert(tableName, entity);
    await client.update(tableName, entity.id, { foo: 'baz' });
    const updated = await client.findOne(tableName, entity.id);
    expect(updated?.foo).toBe('baz');
  });

  it('should delete entity', async () => {
    await client.insert(tableName, entity);
    await client.delete(tableName, entity.id);
    const found = await client.findOne(tableName, entity.id);
    expect(found).toBeNull();
  });

  it('should clear all data', async () => {
    await client.insert(tableName, entity);
    await client.clear();
    const res = await client.query(tableName, {});
    expect(res.items.length).toBe(0);
  });

  it('should batch operations with insert', async () => {
    await client.batch(tableName, [
      { type: 'insert', data: { ...entity2 } },
      { type: 'update', id: entity2.id, data: { foo: 'baz' } },
      { type: 'delete', id: entity2.id },
    ]);
    const res = await client.query(tableName, {});
    expect(res.items.length).toBe(0);
  });

  it('should support createMany/updateMany/deleteMany/findAll', async () => {
    await client.createMany(tableName, [entity, entity2]);
    let all = await client.findAll(tableName);
    expect(all.length).toBe(2);
    await client.updateMany(tableName, [entity.id, entity2.id], { foo: 'qux' });
    all = await client.findAll(tableName);
    expect(all.every(e => e.foo === 'qux')).toBe(true);
    await client.deleteMany(tableName, [entity.id, entity2.id]);
    all = await client.findAll(tableName);
    expect(all.length).toBe(0);
  });

  it('should findAll with filter', async () => {
    await client.createMany(tableName, [entity, entity2]);
    const filtered = await client.findAll(tableName, { foo: 'bar' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe(entity.id);
  });

  it('should return metadata and stats', async () => {
    await client.insert(tableName, entity);
    const meta = await client.getMetadata();
    expect(meta[tableName].count).toBe(1);
    const stats = await client.getStats();
    expect(stats.totalTables).toBe(1);
    expect(stats.totalRows).toBe(1);
  });

  it('should always have permission and be healthy', async () => {
    expect(await client.hasPermission('any', 'any')).toBe(true);
    expect((await client.checkHealth()).healthy).toBe(true);
  });

  it('should support reset/dispose', async () => {
    await client.insert(tableName, entity);
    await client.reset();
    let res = await client.query(tableName, {});
    expect(res.items.length).toBe(0);
    await client.insert(tableName, entity);
    await client.dispose();
    res = await client.query(tableName, {});
    expect(res.items.length).toBe(0);
    expect(client.isInitialized()).toBe(false);
  });
});
