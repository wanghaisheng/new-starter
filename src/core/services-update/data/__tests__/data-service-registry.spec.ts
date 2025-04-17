import { DataServiceRegistry } from '../registry/data-service-registry';
import { DataServiceFactory } from '../factory/data-service-factory';
import type { DataServiceConfig } from '../types';

describe('DataServiceRegistry', () => {
  const sqliteConfig: DataServiceConfig = {
    environment: 'test',
    services: {
      data: {
        adapter: 'sqlite',
        options: { sqlite: { name: 'testdb.sqlite' } }
      }
    }
  };
  const indexeddbConfig: DataServiceConfig = {
    environment: 'test',
    services: {
      data: {
        adapter: 'indexeddb',
        options: { indexeddb: { name: 'testdb', version: 1 } }
      }
    }
  };

  it('should register and get service instances by key', async () => {
    const sqliteService = DataServiceFactory.createService(sqliteConfig);
    const indexeddbService = DataServiceFactory.createService(indexeddbConfig);
    DataServiceRegistry.register('sqlite', sqliteService);
    DataServiceRegistry.register('indexeddb', indexeddbService);
    expect(DataServiceRegistry.get('sqlite')).toBe(sqliteService);
    expect(DataServiceRegistry.get('indexeddb')).toBe(indexeddbService);
  });

  it('should unregister service instance', () => {
    DataServiceRegistry.unregister('sqlite');
    expect(DataServiceRegistry.get('sqlite')).toBeUndefined();
  });

  it('should return undefined for non-existent key', () => {
    expect(DataServiceRegistry.get('not-exist')).toBeUndefined();
  });
});
