import { describe, it, expect, vi } from 'vitest';
import { DataServiceFactory } from './data-service-factory';

const baseConfig = {
  mode: 'hybrid',
  envStage: 'dev',
  services: {
    data: {
      onlineProvider: 'mock',
      offlineProvider: 'mock',
      orm: 'mock',
      options: { enableMock: true },
    },
  },
};

describe('DataServiceFactory', () => {
  it('should create a data service instance (mock/hybrid)', () => {
    const service = DataServiceFactory.createService(baseConfig as any);
    expect(service).toBeDefined();
    expect(typeof service.connect).toBe('function');
  });

  it('should create a single provider client', () => {
    const config = { ...baseConfig, mode: 'single' };
    const service = DataServiceFactory.createService(config as any);
    expect(service).toBeDefined();
  });
});
