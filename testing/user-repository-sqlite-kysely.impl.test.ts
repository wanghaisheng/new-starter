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
    expect(Array.isArray(all.rows)).toBe(true);
    expect(all.rows.length).toBeGreaterThanOrEqual(2);
    const ids = all.rows.map((u: User) => u.id);
    expect(ids).toContain('u6');
    expect(ids).toContain('u7');
  });

  it('should createMany users', async () => {
    const users = [
      { ...MOCK_USERS[0], id: 'u8', email: 'u8@kysely.com', phone: 'multi1' },
      { ...MOCK_USERS[1], id: 'u9', email: 'u9@kysely.com', phone: 'multi2' }
    ];
    if (repo.createMany) {
      const created = await repo.createMany(users);
      expect(Array.isArray(created)).toBe(true);
      expect(created.length).toBe(2);
      const all = await repo.findAll();
      const ids = all.rows.map((u: User) => u.id);
      expect(ids).toContain('u8');
      expect(ids).toContain('u9');
    } else {
      throw new Error('createMany not implemented');
    }
  });

  it('should updateMany users', async () => {
    const users = [
      { ...MOCK_USERS[0], id: 'u10', name: 'A', email: 'u10@kysely.com', phone: 'umany1' },
      { ...MOCK_USERS[1], id: 'u11', name: 'B', email: 'u11@kysely.com', phone: 'umany2' }
    ];
    if (repo.createMany && repo.updateMany) {
      await repo.createMany(users);
      const updatedCount = await repo.updateMany(['u10', 'u11'], { name: 'Updated' });
      expect(updatedCount).toBe(2);
      const all = await repo.findAll();
      for (const u of all.rows.filter((u: User) => ['u10','u11'].includes(u.id))) {
        expect(u.name).toBe('Updated');
      }
    } else {
      throw new Error('createMany or updateMany not implemented');
    }
  });

  it('should deleteMany users', async () => {
    const users = [
      { ...MOCK_USERS[0], id: 'u12', email: 'u12@kysely.com', phone: 'dmany1' },
      { ...MOCK_USERS[1], id: 'u13', email: 'u13@kysely.com', phone: 'dmany2' }
    ];
    if (repo.createMany && repo.deleteMany) {
      await repo.createMany(users);
      const deletedCount = await repo.deleteMany(['u12', 'u13']);
      expect(deletedCount).toBe(2);
      const all = await repo.findAll();
      const ids = all.rows.map((u: User) => u.id);
      expect(ids).not.toContain('u12');
      expect(ids).not.toContain('u13');
    } else {
      throw new Error('createMany or deleteMany not implemented');
    }
  });

  it('should updateMany and deleteMany users', async () => {
    const users = [
      { ...MOCK_USERS[0], id: 'd1', email: 'd1@kysely.com', phone: 'd1' },
      { ...MOCK_USERS[1], id: 'd2', email: 'd2@kysely.com', phone: 'd2' }
    ];
    if (repo.createMany && repo.updateMany && repo.deleteMany) {
      await repo.createMany(users);
      await repo.updateMany([users[0].id, users[1].id], { name: 'BatchKysely' });
      const all = await repo.findAll();
      expect(all.rows.every((u: User) => u.name === 'BatchKysely')).toBe(true);
      await repo.deleteMany([users[0].id, users[1].id]);
      const after = await repo.findAll();
      expect((after.rows.map((u: User) => u.id) as string[]).includes('d1')).toBe(false);
      expect((after.rows.map((u: User) => u.id) as string[]).includes('d2')).toBe(false);
    }
  });

  it('should throw on duplicate email', async () => {
    const user = { ...MOCK_USERS[0], id: 'dup1', email: 'dup@kysely.com', phone: 'dup1' };
    await repo.create(user);
    await expect(repo.create({ ...user, id: 'dup2' })).rejects.toThrow();
  });

  it('should query users with orderBy', async () => {
    await repo.create({ ...MOCK_USERS[0], id: 'u14', name: 'Z', email: 'u14@kysely.com', phone: 'order1' });
    await repo.create({ ...MOCK_USERS[1], id: 'u15', name: 'A', email: 'u15@kysely.com', phone: 'order2' });
    const result = await repo.findAll({}, { orderBy: { field: 'name', direction: 'asc' } });
    expect(result.rows[0].name <= result.rows[1].name).toBe(true);
  });
});
