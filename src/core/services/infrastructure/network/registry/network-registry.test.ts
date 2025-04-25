import { NetworkFactory } from '../factory/network-factory';
import { NetworkRegistry } from './network-registry';
import type { INetworkService } from '../types/network-types';

describe('NetworkRegistry & NetworkFactory', () => {
  it('should get built-in mock adapter', () => {
    const service = NetworkFactory.createNetworkService({ provider: 'mock' });
    expect(service).toBeDefined();
    expect(typeof service.getStatus).toBe('function');
    expect(['online', 'offline']).toContain(service.getStatus());
  });

  it('should get built-in browser adapter', () => {
    const service = NetworkFactory.createNetworkService({ provider: 'browser' });
    expect(service).toBeDefined();
    expect(typeof service.getStatus).toBe('function');
  });

  it('should fallback to default if provider not found', () => {
    const service = NetworkFactory.createNetworkService({ provider: 'not-exist' });
    expect(service).toBeDefined();
    expect(typeof service.getStatus).toBe('function');
  });

  it('should register and get custom adapter', () => {
    class CustomService implements INetworkService {
      async initialize() {}
      async dispose() {}
      isInitialized() { return true; }
      getStatus() { return 'online'; }
      onStatusChange() {}
    }
    NetworkRegistry.registerAdapter('custom', () => new CustomService());
    const service = NetworkFactory.createNetworkService({ provider: 'custom' });
    expect(service).toBeInstanceOf(CustomService);
    expect(service.getStatus()).toBe('online');
  });

  it('should list all available providers', () => {
    const providers = NetworkRegistry.getAvailableProviders();
    expect(providers).toEqual(expect.arrayContaining(['mock', 'browser', 'capacitor', 'default', 'custom']));
  });
});
