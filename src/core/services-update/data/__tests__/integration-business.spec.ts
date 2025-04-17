import { DataServiceFactory } from '../factory/data-service-factory';
import { DataServiceRegistry } from '../registry/data-service-registry';
import type { DataServiceConfig } from '../types';

describe('业务层集成测试', () => {
  const sqliteConfig: DataServiceConfig = {
    environment: 'test',
    services: {
      data: {
        adapter: 'sqlite',
        options: { sqlite: { name: 'biz.sqlite' } }
      }
    }
  };
  const indexeddbConfig: DataServiceConfig = {
    environment: 'test',
    services: {
      data: {
        adapter: 'indexeddb',
        options: { indexeddb: { name: 'bizdb', version: 1 } }
      }
    }
  };

  it('should switch adapters without changing business code', async () => {
    const sqliteService = DataServiceFactory.createService(sqliteConfig);
    const indexeddbService = DataServiceFactory.createService(indexeddbConfig);
    DataServiceRegistry.register('sqlite', sqliteService);
    DataServiceRegistry.register('indexeddb', indexeddbService);

    for (const key of ['sqlite', 'indexeddb']) {
      const service = DataServiceRegistry.get(key)!;
      await service.initialize();
      await service.insert('users', { id: 'u1', name: 'Alice' });
      const user = await service.findOne('users', 'u1');
      expect(user?.name).toBe('Alice');
      await service.delete('users', 'u1');
      const deleted = await service.findOne('users', 'u1');
      expect(deleted).toBeNull();
    }
  });

  it('should isolate data between different adapters', async () => {
    const sqliteService = DataServiceRegistry.get('sqlite')!;
    const indexeddbService = DataServiceRegistry.get('indexeddb')!;
    await sqliteService.insert('users', { id: 'u2', name: 'SqliteUser' });
    await indexeddbService.insert('users', { id: 'u2', name: 'IndexedUser' });
    const sqliteUser = await sqliteService.findOne('users', 'u2');
    const indexedUser = await indexeddbService.findOne('users', 'u2');
    expect(sqliteUser?.name).toBe('SqliteUser');
    expect(indexedUser?.name).toBe('IndexedUser');
  });

  it('should handle errors gracefully', async () => {
    const sqliteService = DataServiceRegistry.get('sqlite')!;
    await expect(sqliteService.delete('users', 'not_exist')).resolves.toBeUndefined();
  });
});
