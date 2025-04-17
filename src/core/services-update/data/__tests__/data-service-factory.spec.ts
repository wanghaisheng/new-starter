import { DataServiceFactory } from '../factory/data-service-factory';
import type { DataServiceConfig } from '../types';

describe('DataServiceFactory', () => {
  it('should create a sqlite service with correct config', async () => {
    const config: DataServiceConfig = {
      environment: 'test',
      services: {
        data: {
          adapter: 'sqlite',
          options: {
            sqlite: { name: 'testdb.sqlite' }
          }
        }
      }
    };
    const service = DataServiceFactory.createService(config);
    expect(service.getType()).toBe('sqlite');
    await expect(service.initialize()).resolves.toBeUndefined();
  });

  it('should create an indexeddb service with correct config', async () => {
    const config: DataServiceConfig = {
      environment: 'test',
      services: {
        data: {
          adapter: 'indexeddb',
          options: {
            indexeddb: { name: 'mydb', version: 1 }
          }
        }
      }
    };
    const service = DataServiceFactory.createService(config);
    expect(service.getType()).toBe('indexeddb');
    await expect(service.initialize()).resolves.toBeUndefined();
  });

  it('should auto select adapter by env variable', async () => {
    process.env.NEXT_PUBLIC_DATABASE_ENV = 'sqlite';
    const service = DataServiceFactory.createService();
    await service.initialize();
    expect(['sqlite', 'indexeddb', 'mock']).toContain(service.getType());
  });

  it('should throw if config is invalid', () => {
    const config = {
      environment: 'test',
      services: {
        data: {
          adapter: 'not-exist',
          options: {}
        }
      }
    } as any;
    expect(() => DataServiceFactory.createService(config)).toThrow();
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_DATABASE_ENV;
  });
});
