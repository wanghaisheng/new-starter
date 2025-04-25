import { describe, it, expect, vi } from 'vitest';
import { BaseDatabaseClient } from './base-database-client';

describe('BaseDatabaseClient', () => {
  class TestClient extends BaseDatabaseClient {
    async batch() {}
    async executeRawQuery() { return []; }
    getType() { return 'test'; }
    isInitialized() { return true; }
    getConfig() { return {}; }
    async initialize() {}
  }
  it('should cache set/get', async () => {
    const client = new TestClient();
    await client.set('k', 123);
    expect(await client.get('k')).toBe(123);
  });
  it('should clear cache', async () => {
    const client = new TestClient();
    await client.set('k', 1);
    await client.cacheClear();
    expect(await client.get('k')).toBeUndefined();
  });
});
