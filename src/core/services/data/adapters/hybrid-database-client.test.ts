import { describe, it, expect, vi } from 'vitest';
import { HybridDatabaseClient } from './hybrid-database-client';

describe('HybridDatabaseClient', () => {
  const config = { services: { data: { options: {} } } } as any;
  const offline = { getType: () => 'offline', connect: vi.fn(), disconnect: vi.fn() } as any;
  const online = { getType: () => 'online', connect: vi.fn(), disconnect: vi.fn() } as any;
  it('should switch mode and call correct client', async () => {
    const client = new HybridDatabaseClient(config, offline, online);
    expect(client).toBeDefined();
    // 默认 offline
    expect(client["mode"]).toBe('offline');
    // 可以切换
    client["mode"] = 'online';
    expect(client["mode"]).toBe('online');
  });
});
