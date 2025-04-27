import { describe, it, beforeEach, expect, beforeAll, afterAll } from 'vitest';
import { User } from '@/core/lib/db/types/user.types';
import { MOCK_USERS } from '@/core/lib/db/types/__mocks__/mock-data';
import { UserRepository } from '@/core/lib/db/repositories/impl/user-repository';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import { schemaRegistry } from '@/core/lib/db/schema/index';
import userSchema from '@/core/lib/db/schema/definitions/user-schema';
import { DrizzleSchemaAdapter } from '@/core/lib/db/schema/adapters/drizzle-adapter';
import fs from 'fs';
import DrizzleSQLiteClient from '@/core/lib/db/clients/sqlite/drizzle-sqlite-client';
import { DataMode } from '@/core/lib/db/types/common';
import { TableSchema, ColumnDefinition } from '@/core/lib/db/types/database';

let dataService: any;
let repo: UserRepository;
let dbFile: string;
let schemas: TableSchema[];
let drizzleSchema: Record<string, any>;
let migrationSQL: string[];

beforeAll(async () => {
  schemaRegistry.register(userSchema as TableSchema);
  schemas = schemaRegistry.getAllSchemas() as TableSchema[];
  drizzleSchema = {};
  for (const schema of schemas) {
    drizzleSchema[schema.name] = DrizzleSchemaAdapter.convertToSqliteTable(schema);
  }
  migrationSQL = DrizzleSchemaAdapter.generateMigrationSQL(schemas);

  dbFile = `test_drizzle_impl_${Date.now()}.sqlite`;

  // 初始化 client
  const dbClient = new DrizzleSQLiteClient<User>(dbFile, drizzleSchema, schemas);
  for (const sql of migrationSQL) {
    dbClient['db'].prepare(sql).run();
  }
  await dbClient.initialize();
  DataServiceRegistry.register('default', dbClient as any);
});

afterAll(() => {
  try { if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile); } catch (e) {}
  DataServiceRegistry.unregister('default');
  schemaRegistry.clear && schemaRegistry.clear();
});

beforeEach(async () => {
  // 清理旧文件
  try { if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile); } catch (e) {}
  dataService = undefined;
  repo = undefined;
  // 不再清理 registry，保证 default 实例存在
  dataService = DataServiceRegistry.get('default');
  if (!dataService) throw new Error('DataServiceRegistry default 实例未注册');
  if (dataService.client && dataService.client['db']) {
    for (const sql of migrationSQL) {
      dataService.client['db'].prepare(sql).run();
    }
    await dataService.client.initialize?.();
  }
  repo = new UserRepository(dataService);
});

describe('UserRepository (IDataService, online-sqlite-drizzle)', () => {
  it('should create and find user by id', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u1', email: 'unique1@test.com', phone: 'unique1' };
    await repo.create(user);
    const found = await repo.findById('u1');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u1');
  });

  it('should update user', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u2', name: 'OldName', email: 'unique2@test.com', phone: 'unique2' };
    await repo.create(user);
    await repo.update('u2', { name: 'NewName' });
    const updated = await repo.findById('u2');
    expect(updated!.name).toBe('NewName');
  });

  it('should delete user', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u3', email: 'unique3@test.com', phone: 'unique3' };
    await repo.create(user);
    await repo.delete('u3');
    const found = await repo.findById('u3');
    expect(found).toBeNull();
  });

  it('should find by email', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u4', email: 'findme@test.com', phone: 'unique4' };
    await repo.create(user);
    const found = await repo.findByEmail('findme@test.com');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u4');
  });

  it('should find by phone', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u5', email: 'unique5@test.com', phone: 'findmephone' };
    await repo.create(user);
    const found = await repo.findByPhone('findmephone');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u5');
  });

  it('should findAll users', async () => {
    await repo.create({ ...MOCK_USERS[0], id: 'u6', email: 'a@test.com', phone: 'a' });
    await repo.create({ ...MOCK_USERS[1], id: 'u7', email: 'b@test.com', phone: 'b' });
    const all = await repo.findAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
    const ids = all.rows.map((u: User) => u.id);
    expect(ids).toContain('u6');
    expect(ids).toContain('u7');
  });

  it('should createMany and findAll users', async () => {
    const users = [
      { ...MOCK_USERS[0], id: 'b1', email: 'b1@test.com', phone: 'b1' },
      { ...MOCK_USERS[1], id: 'b2', email: 'b2@test.com', phone: 'b2' }
    ];
    if (repo.createMany) {
      await repo.createMany(users);
      const all = await repo.findAll();
      expect(all.rows.map((u: User) => u.id)).toEqual(expect.arrayContaining(['b1', 'b2']));
    }
  });

  it('should not allow duplicate email', async () => {
    const user = { ...MOCK_USERS[0], id: 'c1', email: 'dup@test.com', phone: 'c1' };
    await repo.create(user);
    await expect(repo.create({ ...user, id: 'c2' })).rejects.toThrow();
  });

  it('should updateMany and deleteMany users', async () => {
    const users = [
      { ...MOCK_USERS[0], id: 'd1', email: 'd1@test.com', phone: 'd1' },
      { ...MOCK_USERS[1], id: 'd2', email: 'd2@test.com', phone: 'd2' }
    ];
    if (repo.createMany && repo.updateMany && repo.deleteMany) {
      await repo.createMany(users);
      await repo.updateMany([users[0].id, users[1].id], { name: 'Batch' });
      const all = await repo.findAll();
      expect(all.rows.every((u: User) => u.name === 'Batch')).toBe(true);
      await repo.deleteMany([users[0].id, users[1].id]);
      const after = await repo.findAll();
      expect(after.rows.map((u: User) => u.id)).not.toContain('d1');
      expect(after.rows.map((u: User) => u.id)).not.toContain('d2');
    }
  });
});
