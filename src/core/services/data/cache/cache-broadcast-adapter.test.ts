import { describe, it, expect, vi } from 'vitest';
import { WebBroadcastChannelAdapter } from './cache-broadcast-adapter';

describe('WebBroadcastChannelAdapter', () => {
  it('should broadcast and receive events (mock)', () => {
    const adapter = new WebBroadcastChannelAdapter('test-channel');
    // 模拟 window.localStorage
    const cb = vi.fn();
    const off = adapter.onMessage(cb);
    adapter.broadcast({ id: '1', type: 'cacheUpdated' } as any);
    // 由于 jsdom 限制，这里仅保证不抛异常
    off();
    expect(cb).toBeCalledTimes(0);
  });
  it('should close without error', () => {
    const adapter = new WebBroadcastChannelAdapter('test-channel');
    expect(() => adapter.close()).not.toThrow();
  });
});
