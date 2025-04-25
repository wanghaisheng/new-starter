import { describe, it, expect, vi } from 'vitest';
import { SyncManager } from './sync-manager';

describe('SyncManager', () => {
  it('should construct and expose sync methods', () => {
    const offline = { sync: vi.fn() } as any;
    const online = { sync: vi.fn() } as any;
    const mgr = new SyncManager(offline, online);
    expect(mgr).toBeDefined();
    expect(typeof mgr.syncAll).toBe('function');
  });
});
