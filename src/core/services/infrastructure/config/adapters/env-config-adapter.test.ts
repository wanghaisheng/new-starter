import { EnvConfigAdapter } from './env-config-adapter';
import { CONFIG_KEYS } from '../config-keys';

describe('EnvConfigAdapter', () => {
  let adapter: EnvConfigAdapter;
  beforeEach(async () => {
    adapter = new EnvConfigAdapter();
    // 模拟 process.env 和 window 环境
    (global as any).process = { env: { [CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL]: 'http://env.com' } };
    (global as any).window = { [CONFIG_KEYS.NEXT_PUBLIC_LOG_LEVEL]: 'debug' };
    await adapter.initialize();
  });

  it('should read from process.env', () => {
    expect(adapter.get(CONFIG_KEYS.NEXT_PUBLIC_API_BASE_URL)).toBe('http://env.com');
  });

  it('should read from window if not in process.env', () => {
    expect(adapter.get(CONFIG_KEYS.NEXT_PUBLIC_LOG_LEVEL)).toBe('debug');
  });

  it('should set/get/has/remove correctly', () => {
    adapter.set('FOO', 'bar');
    expect(adapter.get('FOO')).toBe('bar');
    expect(adapter.has('FOO')).toBe(true);
    adapter.remove('FOO');
    expect(adapter.has('FOO')).toBe(false);
  });

  it('refresh should do nothing and not throw', async () => {
    await expect(adapter.refresh()).resolves.toBeUndefined();
  });
});
