import 'fake-indexeddb/auto';
import { describe, it, beforeEach, expect, beforeAll, afterAll } from 'vitest';
import { User } from '@/core/lib/db/types/user.types';
import { MOCK_USERS } from '@/core/lib/db/types/__mocks__/mock-data';
import { UserRepository } from '@/core/lib/db/repositories/impl/user-repository';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import type { DatabaseConfig, DatabaseEngine } from '@/core/lib/db/types/database';
import { OfflineDbProvider } from '@/core/lib/db/types/common';
import { registerLoggerProvider } from '@/core/services/infrastructure/logger/registry/logger-registry';
import { MockLoggerAdapter } from '@/core/services/infrastructure/logger/adapters/mock-adapter';
import { initConfig } from '@/core/services/infrastructure/config';
import { schemaRegistry } from '@/core/lib/db/schema/schema-registry-singleton';
import userSchema from '@/core/lib/db/schema/definitions/user-schema';

// 初始化配置和 mock 日志服务，确保 logger 为同步实现，避免 async 问题
beforeAll(async () => {
  await initConfig(); // 确保 configService/init 完成
  registerLoggerProvider('mock', MockLoggerAdapter.getInstance);
  process.env.LOGGER_PROVIDER = 'mock';
  // 注册用户表 schema，确保 IndexedDB 能自动建表
  schemaRegistry.register(userSchema);
});

function deleteDatabaseAsync(name: string): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => setTimeout(resolve, 100);
  });
}

let dataService: any;
let repo: UserRepository;

const DB_NAME = 'test';

const createIndexedDBClient = async () => {
  const config: DatabaseConfig = {
    engine: 'indexeddb' as DatabaseEngine,
    name: DB_NAME,
    tables: {},
    storage: { offline: { type: OfflineDbProvider.INDEXEDDB, dbName: DB_NAME } }
  };
  const client = new IndexedDBClient<User>(config);
  await client.initialize?.();
  return client;
};

afterAll(async () => {
  await DataServiceRegistry.dispose('default');
  await deleteDatabaseAsync(DB_NAME);
});

beforeEach(async () => {
  await DataServiceRegistry.dispose('default'); // 1. 释放旧连接
  await deleteDatabaseAsync(DB_NAME);           // 2. 删除数据库
  const client = await createIndexedDBClient(); // 3. 新建 client
  DataServiceRegistry.register('default', client as any); // 4. 注册
  dataService = DataServiceRegistry.get('default');
  repo = new UserRepository(dataService);       // 5. 新建 repo
});

describe('UserRepository (IDataService, offline-indexeddb)', () => {
  it('should create and find user by id', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u1', email: 'u1@test.com', phone: '10000000001', googleId: 'gid_u1' };
    await repo.create(user);
    const found = await repo.findById('u1');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u1');
  });

  it('should update user', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u2', name: 'OldName', email: 'u2@test.com', phone: '10000000002', googleId: 'gid_u2' };
    await repo.create(user);
    await repo.update('u2', { name: 'NewName' });
    const updated = await repo.findById('u2');
    expect(updated!.name).toBe('NewName');
  });

  it('should delete user', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u3', email: 'u3@test.com', phone: '10000000003', googleId: 'gid_u3' };
    await repo.create(user);
    await repo.delete('u3');
    const deleted = await repo.findById('u3');
    expect(deleted).toBeNull();
  });

  it('should return all users', async () => {
    await repo.create({ ...MOCK_USERS[0], id: 'u4', email: 'u4@test.com', phone: '10000000004', googleId: 'gid_u4' });
    await repo.create({ ...MOCK_USERS[1], id: 'u5', email: 'u5@test.com', phone: '10000000005', googleId: 'gid_u5' });
    const all = await repo.findAll();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThanOrEqual(2);
    const ids = all.rows.map((u: User) => u.id);
    expect(ids).toContain('u4');
    expect(ids).toContain('u5');
  });

  it('should update only specified fields', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u6', name: 'Original', age: 20, email: 'u6@test.com', phone: '10000000006', googleId: 'gid_u6' };
    await repo.create(user);
    await repo.update('u6', { age: 30 });
    const updated = await repo.findById('u6');
    expect(updated!.age).toBe(30);
    expect(updated!.name).toBe('Original');
  });

  it('should handle not found gracefully', async () => {
    const notFound = await repo.findById('not-exist');
    expect(notFound).toBeNull();
    // UserRepository.delete 明确返回 boolean，未找到时返回 true（始终 return true）
    // 断言返回 true
    const delResult = await repo.delete('not-exist');
    expect(delResult).toBe(true);
  });

  it('should createMany and findAll users', async () => {
    const users = [
      { ...MOCK_USERS[0], id: 'b1', email: 'b1@test.com', phone: 'b1', googleId: 'g1' },
      { ...MOCK_USERS[1], id: 'b2', email: 'b2@test.com', phone: 'b2', googleId: 'g2' }
    ];
    if (repo.createMany) {
      await repo.createMany(users);
      const all = await repo.findAll();
      expect(all.rows.map<User, string>((u: User) => u.id)).toEqual(expect.arrayContaining(['b1', 'b2']));
    }
  });

  it('should not allow duplicate email', async () => {
    const user = { ...MOCK_USERS[0], id: 'dup1', email: 'dup@indexeddb.com', phone: 'dup1', googleId: 'gdup' };
    await repo.create(user);
    await expect(repo.create({ ...user, id: 'dup2' })).rejects.toThrow();
  });

  it('should updateMany and deleteMany users', async () => {
    const users = [
      { ...MOCK_USERS[0], id: 'd1', email: 'd1@indexeddb.com', phone: 'd1', googleId: 'gd1' },
      { ...MOCK_USERS[1], id: 'd2', email: 'd2@indexeddb.com', phone: 'd2', googleId: 'gd2' }
    ];
    if (repo.createMany && repo.updateMany && repo.deleteMany) {
      await repo.createMany(users);
      await repo.updateMany([users[0].id, users[1].id], { name: 'BatchIndexed' });
      const all = await repo.findAll();
      expect(all.rows.every<User>((u: User) => u.name === 'BatchIndexed')).toBe(true);
      await repo.deleteMany([users[0].id, users[1].id]);
      const after = await repo.findAll();
      expect(after.rows.map<User, string>((u: User) => u.id)).not.toContain('d1');
      expect(after.rows.map<User, string>((u: User) => u.id)).not.toContain('d2');
    }
  });
});
