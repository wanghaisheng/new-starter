import { RemoteConfigAdapter } from './remote-config-adapter';
import { CONFIG_KEYS } from '../config-keys';

global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({
    [CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL]: 'http://remote.com',
    [CONFIG_KEYS.NEXT_PUBLIC_LOG_LEVEL]: 'info',
  }),
})) as any;

describe('RemoteConfigAdapter', () => {
  let adapter: RemoteConfigAdapter;
  beforeEach(async () => {
    adapter = new RemoteConfigAdapter();
    await adapter.initialize();
  });

  it('should fetch and update config from remote', () => {
    expect(adapter.get(CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL)).toBe('http://remote.com');
    expect(adapter.get(CONFIG_KEYS.NEXT_PUBLIC_LOG_LEVEL)).toBe('info');
  });

  it('should set/get/has/remove correctly', () => {
    adapter.set('FOO', 'bar');
    expect(adapter.get('FOO')).toBe('bar');
    expect(adapter.has('FOO')).toBe(true);
    adapter.remove('FOO');
    expect(adapter.has('FOO')).toBe(false);
  });

  it('refresh should re-fetch config', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        [CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL]: 'http://remote2.com',
      }),
    }));
    await adapter.refresh();
    expect(adapter.get(CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL)).toBe('http://remote2.com');
  });
});
