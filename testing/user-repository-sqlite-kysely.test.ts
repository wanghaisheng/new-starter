import { describe, it, beforeEach, expect, beforeAll } from 'vitest';
import { User } from '@/core/lib/db/types/user.types';
import userSchema from '@/core/lib/db/schema/definitions/user-schema';
import { MOCK_USERS } from '@/core/lib/db/types/__mocks__/mock-data';
import { UserRepository } from '@/core/lib/db/repositories/impl/user-repository';
import KyselySQLiteClient from '@/core/lib/db/clients/sqlite/kysely-sqlite-client';
import fs from 'fs';

let dbClient: KyselySQLiteClient<User>;
let repo: UserRepository;
const dbFile = `test_kysely_${Date.now()}.sqlite`;

beforeEach(async () => {
  // 清理 SQLite 文件（避免 EBUSY，尝试关闭连接后再删）
  try {
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  } catch (e) {
    // 忽略 busy 错误
  }
  dbClient = new KyselySQLiteClient<User>(dbFile, [userSchema]);
  await dbClient.initialize();
  repo = new UserRepository(dbClient);
});

describe('UserRepository (KyselySQLiteClient)', () => {
  it('should create and find user by id', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u1' };
    await repo.create(user);
    const found = await repo.findById('u1');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u1');
  });

  it('should update user', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u2', name: 'OldName' };
    await repo.create(user);
    await repo.update('u2', { name: 'NewName' });
    const updated = await repo.findById('u2');
    expect(updated!.name).toBe('NewName');
  });

  it('should delete user', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u3' };
    await repo.create(user);
    await repo.delete('u3');
    const deleted = await repo.findById('u3');
    expect(deleted).toBeNull();
  });

  it('should find user by email', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u4', email: 'test@example.com' };
    await repo.create(user);
    const all = await repo.findAll();
    console.log('All users after insert:', all);
    // 检查所有用户的 email 字段
    for (const u of all) {
      console.log('User:', u.id, 'email:', u.email);
    }
    const found = await repo.findByEmail('test@example.com');
    console.log('Query result for email:', found);
    expect(found).toBeTruthy();
    expect(found!.email).toBe('test@example.com');
  });

  it('should find all users', async () => {
    await repo.create({ ...MOCK_USERS[0], id: 'u5' });
    await repo.create({ ...MOCK_USERS[1], id: 'u6' });
    const all = await repo.findAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });
});
