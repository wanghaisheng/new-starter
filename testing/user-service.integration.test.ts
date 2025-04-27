import dotenv from 'dotenv';
dotenv.config();

import { describe, it, beforeEach, expect, afterAll, beforeAll } from 'vitest';
import { ConfigService } from '@/core/services/infrastructure/config/service/config-service';
import { EnvConfigAdapter } from '@/core/services/infrastructure/config/adapters/env-config-adapter';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';
import { UserRepository } from '@/core/services/business/user/repository/user-repository';
import { UserService } from '@/core/services/business/user/service/user-service';
import { schemaRegistry } from '@/core/lib/db/schema/index';
import userSchema from '@/core/lib/db/schema/definitions/user-schema';
import { DrizzleSchemaAdapter } from '@/core/lib/db/schema/adapters/drizzle-adapter';
import DrizzleSQLiteClient from '@/core/lib/db/clients/sqlite/drizzle-sqlite-client';
import type { User } from '@/core/lib/db/types/user.types';
import { MOCK_USERS } from '@/core/lib/db/types/__mocks__/mock-data';
import fs from 'fs';

let configService: ConfigService;
let dbFile: string;
let schemas: any[];
let drizzleSchema: Record<string, any>;
let migrationSQL: string[];

beforeAll(async () => {
  // 1. 初始化配置服务（从 .env 或 process.env 读取）
  const configAdapter = new EnvConfigAdapter();
  configService = ConfigService.getInstance(configAdapter);
  await configService.initialize();

  // 2. 注册 schema
  schemaRegistry.register(userSchema as any);
  schemas = schemaRegistry.getAllSchemas();
  drizzleSchema = {};
  for (const schema of schemas) {
    drizzleSchema[schema.name] = DrizzleSchemaAdapter.convertToSqliteTable(schema);
  }
  migrationSQL = DrizzleSchemaAdapter.generateMigrationSQL(schemas);

  // 3. 通过配置服务获取数据库路径
  dbFile = configService.get('DATABASE_FILE') || `test_user_service_${Date.now()}.sqlite`;

  // 4. 注册数据服务工厂到 DataServiceRegistry
  DataServiceRegistry.register('default', () => {
    const dbClient = new DrizzleSQLiteClient<User>(dbFile, drizzleSchema, schemas);
    for (const sql of migrationSQL) {
      dbClient['db'].prepare(sql).run();
    }
    dbClient.initialize();
    return dbClient as any;
  });
});

afterAll(() => {
  try { if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile); } catch (e) {}
  DataServiceRegistry.unregister('default');
  schemaRegistry.clear && schemaRegistry.clear();
  ConfigService.__test_resetInstance();
});

beforeEach(async () => {
  // 每个用例前重置数据库
  const dataService = DataServiceRegistry.get('default');
  if (dataService && dataService.client && dataService.client['db']) {
    for (const sql of migrationSQL) {
      dataService.client['db'].prepare(sql).run();
    }
    await dataService.client.initialize?.();
  }
});

describe('UserRepository + UserService 全链路集成', () => {
  let repo: UserRepository;
  let service: UserService;

  beforeEach(() => {
    // 只需通过 DataServiceRegistry.get 获取数据服务实例
    const dataService = DataServiceRegistry.get('default');
    repo = new UserRepository(dataService);
    service = new UserService(); // 内部同样会 get 到 default 数据服务
  });

  it('UserRepository: create/find', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u1', email: 'repo1@test.com', phone: 'repo1' };
    await repo.create(user);
    const found = await repo.findById('u1');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u1');
  });

  it('UserService: create/find', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u2', email: 'svc2@test.com', phone: 'svc2' };
    await service.createUser(user);
    const found = await service.getUserById('u2');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u2');
  });

  it('UserService: update, delete, getUsers', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u3', email: 'svc3@test.com', phone: 'svc3' };
    await service.createUser(user);
    await service.updateUserProfile('u3', { name: 'updated' });
    const updated = await service.getUserById('u3');
    expect(updated?.name).toBe('updated');
    await service.deleteUser('u3');
    const deleted = await service.getUserById('u3');
    expect(deleted).toBeNull();
  });

  it('UserService: getUserByEmail/Phone', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u4', email: 'svc4@test.com', phone: '444' };
    await service.createUser(user);
    const byEmail = await service.getUserByEmail('svc4@test.com');
    expect(byEmail).toBeTruthy();
    const byPhone = await service.getUserByPhone('444');
    expect(byPhone).toBeTruthy();
  });

  it('异常分支: updateUserProfile not found', async () => {
    await expect(service.updateUserProfile('not-exist', { name: 'x' }))
      .rejects.toThrow('Update failed: users id=not-exist not found');
  });

  it('should batch create and delete users (integration)', async () => {
    const users: User[] = [
      { ...MOCK_USERS[0], id: 'int1', email: 'int1@test.com', phone: 'int1' },
      { ...MOCK_USERS[1], id: 'int2', email: 'int2@test.com', phone: 'int2' }
    ];
    for (const user of users) {
      await service.createUser(user);
    }
    let all = await service.getUsers();
    expect(all.map((u: User) => u.id)).toEqual(expect.arrayContaining(['int1', 'int2']));
    for (const user of users) {
      await service.deleteUser(user.id);
    }
    all = await service.getUsers();
    expect(all.map((u: User) => u.id)).not.toContain('int1');
    expect(all.map((u: User) => u.id)).not.toContain('int2');
  });

  it('should not allow duplicate phone/email (integration)', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'int3', email: 'int3@test.com', phone: 'int3' };
    await service.createUser(user);
    await expect(service.createUser({ ...user, id: 'int4' })).rejects.toThrow();
    await expect(service.createUser({ ...user, id: 'int5', email: 'int5@test.com' })).rejects.toThrow();
    await expect(service.createUser({ ...user, id: 'int6', phone: 'int6' })).rejects.toThrow();
  });
});
