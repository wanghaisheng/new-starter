import { describe, it, beforeEach, expect } from 'vitest';
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
  try { if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile); } catch {}
  dbClient = new KyselySQLiteClient<User>(dbFile, [userSchema]);
  await dbClient.initialize();
  repo = new UserRepository(dbClient);
});

describe('UserRepository (KyselySQLiteClient)', () => {
  it('should create and find user by id', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u1', email: 'u1@kysely.com', phone: 'p1' };
    await repo.create(user);
    const found = await repo.findById('u1');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u1');
  });

  it('should update user', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u2', name: 'OldName', email: 'u2@kysely.com', phone: 'p2' };
    await repo.create(user);
    await repo.update('u2', { name: 'NewName' });
    const updated = await repo.findById('u2');
    expect(updated!.name).toBe('NewName');
  });

  it('should delete user', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u3', email: 'u3@kysely.com', phone: 'p3' };
    await repo.create(user);
    await repo.delete('u3');
    const deleted = await repo.findById('u3');
    expect(deleted).toBeNull();
  });

  it('should find user by email', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u4', email: 'test@example.com', phone: 'p4' };
    await repo.create(user);
    const found = await repo.findByEmail('test@example.com');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u4');
  });

  it('should find user by phone', async () => {
    const user: User = { ...MOCK_USERS[0], id: 'u5', email: 'u5@kysely.com', phone: 'findmephone' };
    await repo.create(user);
    const found = await repo.findByPhone('findmephone');
    expect(found).toBeTruthy();
    expect(found!.id).toBe('u5');
  });

  it('should findAll users', async () => {
    await repo.create({ ...MOCK_USERS[0], id: 'u6', email: 'a@kysely.com', phone: 'a' });
    await repo.create({ ...MOCK_USERS[1], id: 'u7', email: 'b@kysely.com', phone: 'b' });
    const all = await repo.findAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
    const ids = all.map(u => u.id);
    expect(ids).toContain('u6');
    expect(ids).toContain('u7');
  });
});
