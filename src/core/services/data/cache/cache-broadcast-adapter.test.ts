import { describe, it, expect, vi } from 'vitest';
import { CacheBroadcastAdapter } from './cache-broadcast-adapter';

describe('CacheBroadcastAdapter', () => {
  it('should broadcast and receive events', () => {
    const adapter = new CacheBroadcastAdapter();
    const handler = vi.fn();
    adapter.on('cacheUpdated', handler);
    adapter.emit('cacheUpdated', { id: '1' });
    expect(handler).toBeCalled();
  });
});
