import { describe, it, beforeEach, expect } from 'vitest';
import { User } from '@/core/lib/db/types/user.types';
import { MOCK_USERS } from '@/core/lib/db/types/__mocks__/mock-data';
import { UserRepositoryIndexedDB } from '@/core/lib/db/repositories/adapters/user-repository-indexeddb';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { defaultConfig, DatabaseEngine } from '@/core/lib/db/types/database';

function deleteDatabaseAsync(name: string): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => setTimeout(resolve, 100);
  });
}

let repo: UserRepositoryIndexedDB;

beforeEach(async () => {
  await deleteDatabaseAsync('test');
  const config = {
    ...defaultConfig,
    name: 'test',
    engine: 'indexeddb' as DatabaseEngine,
    storage: {
      ...defaultConfig.storage,
      offline: { ...(defaultConfig.storage?.offline ?? {}), type: 'indexeddb' as const, dbName: 'test' as const }
    },
  };
  const client = new IndexedDBClient<User>(config);
  if (typeof client.initialize === 'function') {
    await client.initialize();
  }
  repo = new UserRepositoryIndexedDB(client);
});

describe('UserRepository (IndexedDBClient)', () => {
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
    const found = await repo.findByEmail('test@example.com');
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
