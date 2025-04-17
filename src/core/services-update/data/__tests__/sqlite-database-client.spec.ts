import { SqliteDatabaseClient } from '../adapters/sqlite-database-client';

describe('SqliteDatabaseClient', () => {
  let client: SqliteDatabaseClient;

  beforeEach(async () => {
    client = new SqliteDatabaseClient();
    await client.initialize({ name: 'test.sqlite' });
  });

  it('should insert and query data', async () => {
    await client.insert('users', { id: 'u1', name: 'Alice' });
    const users = await client.query('users');
    expect(users.length).toBeGreaterThan(0);
    expect(users[0].name).toBe('Alice');
  });

  it('should update and delete data', async () => {
    await client.insert('users', { id: 'u2', name: 'Bob' });
    await client.update('users', 'u2', { name: 'Bobby' });
    const user = await client.findOne('users', 'u2');
    expect(user?.name).toBe('Bobby');
    await client.delete('users', 'u2');
    const deleted = await client.findOne('users', 'u2');
    expect(deleted).toBeNull();
  });

  it('should support batch operations', async () => {
    await client.batch('users', [
      { type: 'insert', data: { id: 'u3', name: 'Cathy' } },
      { type: 'insert', data: { id: 'u4', name: 'David' } },
      { type: 'update', id: 'u3', data: { name: 'Catherine' } },
      { type: 'delete', id: 'u4' }
    ]);
    const user = await client.findOne('users', 'u3');
    expect(user?.name).toBe('Catherine');
    const deleted = await client.findOne('users', 'u4');
    expect(deleted).toBeNull();
  });

  it('should support transaction methods', async () => {
    await client.beginTransaction();
    await client.insert('users', { id: 'u5', name: 'Eve' });
    await client.commitTransaction();
    const user = await client.findOne('users', 'u5');
    expect(user?.name).toBe('Eve');
  });

  it('should handle rollbackTransaction', async () => {
    await client.beginTransaction();
    await client.insert('users', { id: 'u6', name: 'Frank' });
    await client.rollbackTransaction();
    const user = await client.findOne('users', 'u6');
    expect(user).toBeNull();
  });
});
