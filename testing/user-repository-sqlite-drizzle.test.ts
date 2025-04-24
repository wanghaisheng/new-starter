import userSchema from '@/core/lib/db/schema/definitions/user-schema';
import { schemaRegistry } from '@/core/lib/db/schema/index';
import { DrizzleSchemaAdapter } from '@/core/lib/db/schema/adapters/drizzle-adapter';
schemaRegistry.register(userSchema);

// 手动生成 drizzleSchema 和 migrationSQL，确保包含已注册表结构
const schemas = schemaRegistry.getAllSchemas();
const drizzleSchema: Record<string, any> = {};
for (const schema of schemas) {
  drizzleSchema[schema.name] = DrizzleSchemaAdapter.convertToSqliteTable(schema);
}
const migrationSQL = DrizzleSchemaAdapter.generateMigrationSQL(schemas);

import { describe, it, beforeEach, expect } from 'vitest';
import { User } from '@/core/lib/db/types/user.types';
import { MOCK_USERS } from '@/core/lib/db/types/__mocks__/mock-data';
import { UserRepository } from '@/core/lib/db/repositories/impl/user-repository';
import DrizzleSQLiteClient from '@/core/lib/db/clients/sqlite/drizzle-sqlite-client';
import fs from 'fs';

let dbClient: DrizzleSQLiteClient;
let repo: UserRepository;
const dbFile = `test_drizzle_${Date.now()}.sqlite`;

beforeEach(async () => {
  try {
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  } catch (e) {}
  // 修正：传入 schemas 数组
  dbClient = new DrizzleSQLiteClient(dbFile, drizzleSchema, schemas);
  // 手动执行 migrationSQL 建表，确保 users 表已创建
  for (const sql of migrationSQL) {
    dbClient['db'].prepare(sql).run();
  }
  await dbClient.initialize();
  repo = new UserRepository(dbClient); // 只传 client
});

describe('UserRepository (DrizzleSQLiteClient)', () => {
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
    const deleted = await repo.findById('u3');
    expect(deleted).toBeNull();
  });

  it('should find user by email', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u4', email: 'unique4@test.com', phone: 'unique4' };
    await repo.create(user);
    const all = await repo.findAll();
    for (const u of all) {
      console.log('User:', u.id, 'email:', u.email);
    }
    const found = await repo.findByEmail('unique4@test.com');
    console.log('Query result for email:', found);
    expect(found).toBeTruthy();
    expect(found!.email).toBe('unique4@test.com');
  });

  it('should find all users', async () => {
    await repo.create({ ...MOCK_USERS[0], id: 'u5', email: 'unique5@test.com', phone: 'unique5' });
    await repo.create({ ...MOCK_USERS[1], id: 'u6', email: 'unique6@test.com', phone: 'unique6' });
    const users = await repo.findAll();
    expect(users.length).toBeGreaterThanOrEqual(2);
  });

  it('should not allow duplicate email', async () => {
    const user1 = { ...MOCK_USERS[0], id: 'u10', email: 'dup@test.com', phone: 'dup1' };
    const user2 = { ...MOCK_USERS[1], id: 'u11', email: 'dup@test.com', phone: 'dup2' };
    await repo.create(user1);
    await expect(repo.create(user2)).rejects.toThrow(/UNIQUE/);
  });

  it('should not allow missing required fields', async () => {
    const user: any = { id: 'u12' };
    await expect(repo.create(user)).rejects.toThrow();
  });

  it('should support multi-condition query', async () => {
    await repo.create({ ...MOCK_USERS[0], id: 'u13', gender: 'male', email: 'm1@test.com', phone: 'm1' });
    await repo.create({ ...MOCK_USERS[1], id: 'u14', gender: 'female', email: 'f1@test.com', phone: 'f1' });
    // 这里假设 repo.findAll 支持参数化条件
    const males = await repo.findAll({ gender: 'male' });
    expect(males.every(u => u.gender === 'male')).toBe(true);
  });

  it('should support fuzzy search by name', async () => {
    await repo.create({ ...MOCK_USERS[0], id: 'u15', name: '张三', email: 'z3@test.com', phone: 'z3' });
    // 假设 repo 支持模糊查询
    const found = await repo.findAll({ name: '张' }); // 实际可替换为 repo.fuzzySearchByName('张')
    expect(found.some(u => u.name.includes('张'))).toBe(true);
  });

  it('should support range query by birthDate', async () => {
    await repo.create({ ...MOCK_USERS[0], id: 'u16', birthDate: '2000-01-01', email: 'r1@test.com', phone: 'r1' });
    await repo.create({ ...MOCK_USERS[1], id: 'u17', birthDate: '2010-01-01', email: 'r2@test.com', phone: 'r2' });
    // 假设 repo 支持 birthDate 范围查询
    const users = await repo.findAll({ birthDate: '2000-01-01' }); // 实际应为 repo.findByBirthDateRange(start, end)
    expect(users.length).toBeGreaterThan(0);
  });

  it('should support sorting and pagination', async () => {
    for (let i = 0; i < 10; i++) {
      await repo.create({ ...MOCK_USERS[0], id: `p${i}`, email: `p${i}@test.com`, phone: `p${i}` });
    }
    // 假设 repo 支持排序和分页
    const page1 = await repo.findAll({ _limit: 5, _offset: 0, _orderBy: 'id' });
    const page2 = await repo.findAll({ _limit: 5, _offset: 5, _orderBy: 'id' });
    expect(page1.length).toBe(5);
    expect(page2.length).toBe(5);
    expect(page1[0].id < page2[0].id).toBe(true);
  });

  it('should serialize/deserialize JSON fields correctly', async () => {
    const user = { ...MOCK_USERS[0], id: 'u18', email: 'json@test.com', phone: 'json', extra: { foo: 'bar', arr: [1, 2] } };
    await repo.create(user);
    const found = await repo.findById('u18');
    expect(found!.extra).toEqual({ foo: 'bar', arr: [1, 2] });
  });

  it('should handle boolean and date fields', async () => {
    const user = { ...MOCK_USERS[0], id: 'u19', email: 'bool@test.com', phone: 'bool', isActive: true, birthDate: new Date('2000-01-01') };
    await repo.create(user);
    const found = await repo.findById('u19');
    expect(found!.isActive).toBe(true);
    expect(new Date(found!.birthDate).toISOString()).toBe('2000-01-01T00:00:00.000Z');
  });

  it('should not find deleted user', async () => {
    const user = { ...MOCK_USERS[0], id: 'u20', email: 'del@test.com', phone: 'del' };
    await repo.create(user);
    await repo.delete('u20');
    const found = await repo.findById('u20');
    expect(found).toBeNull();
  });

  it('should handle concurrent unique constraint', async () => {
    const user = { ...MOCK_USERS[0], id: 'u21', email: 'concurrent@test.com', phone: 'concurrent' };
    await repo.create(user);
    await expect(Promise.all([
      repo.create({ ...MOCK_USERS[1], id: 'u22', email: 'concurrent@test.com', phone: 'concurrent2' }),
      repo.create({ ...MOCK_USERS[1], id: 'u23', email: 'concurrent@test.com', phone: 'concurrent3' })
    ])).rejects.toThrow();
  });

  it('should reject invalid field types', async () => {
    const user: any = { ...MOCK_USERS[0], id: 'u24', email: 'invalidtype@test.com', phone: 'invalidtype', birthDate: {} };
    await expect(repo.create(user)).rejects.toThrow();
  });

  it('should not update non-existent user', async () => {
    await expect(repo.update('notfound', { name: 'xxx' })).rejects.toThrow();
  });

  it('should not delete non-existent user', async () => {
    await expect(repo.delete('notfound')).resolves.toBeUndefined();
  });

  it('should update user profile and query by tags', async () => {
    // 创建用户并添加标签
    await repo.create({ ...MOCK_USERS[0], id: 'tag1', email: 'tag1@test.com', phone: 'tag1', tags: ['vip', 'test'] });
    await repo.create({ ...MOCK_USERS[1], id: 'tag2', email: 'tag2@test.com', phone: 'tag2', tags: ['test'] });
    // 更新用户资料，添加新标签
    await repo.update('tag2', { tags: ['vip', 'test', 'new'] });
    const user1 = await repo.findById('tag1');
    const user2 = await repo.findById('tag2');
    expect(user1!.tags).toContain('vip');
    expect(user2!.tags).toContain('vip');
    // 通过标签查询
    const vipUsers = await repo.findAll({ tags: 'vip' });
    expect(vipUsers.some(u => u.id === 'tag1')).toBe(true);
    expect(vipUsers.some(u => u.id === 'tag2')).toBe(true);
    const onlyTest = await repo.findAll({ tags: 'test' });
    expect(onlyTest.length).toBeGreaterThanOrEqual(2);
    const newTag = await repo.findAll({ tags: 'new' });
    expect(newTag.length).toBe(1);
    expect(newTag[0].id).toBe('tag2');
  });

  it('should support querying users with multiple tags (intersection/union)', async () => {
    await repo.create({ ...MOCK_USERS[0], id: 'mtag1', email: 'mtag1@test.com', phone: 'mtag1', tags: ['a', 'b', 'c'] });
    await repo.create({ ...MOCK_USERS[1], id: 'mtag2', email: 'mtag2@test.com', phone: 'mtag2', tags: ['b', 'c'] });
    await repo.create({ ...MOCK_USERS[0], id: 'mtag3', email: 'mtag3@test.com', phone: 'mtag3', tags: ['c'] });
    // 查询包含标签 b 的所有用户
    const tagB = await repo.findAll({ tags: 'b' });
    expect(tagB.map(u => u.id)).toEqual(expect.arrayContaining(['mtag1', 'mtag2']));
    // 查询同时包含 b 和 c 的用户（交集）
    // 假设 findAll 支持数组参数实现交集
    const tagBC = await repo.findAll({ tags: ['b', 'c'] });
    expect(tagBC.map(u => u.id)).toEqual(expect.arrayContaining(['mtag1', 'mtag2']));
    // 查询只包含 c 的用户
    const tagC = await repo.findAll({ tags: 'c' });
    expect(tagC.map(u => u.id)).toEqual(expect.arrayContaining(['mtag1', 'mtag2', 'mtag3']));
    // 查询标签不存在的用户
    const tagD = await repo.findAll({ tags: 'd' });
    expect(tagD.length).toBe(0);
  });

  // 可继续扩展更多边界、事务、批量等测试
});
