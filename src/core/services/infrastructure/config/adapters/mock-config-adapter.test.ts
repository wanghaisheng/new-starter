import { MockConfigAdapter } from './mock-config-adapter';
import { CONFIG_KEYS } from '../config-keys';

describe('MockConfigAdapter', () => {
  let adapter: MockConfigAdapter;
  beforeEach(async () => {
    adapter = new MockConfigAdapter();
    await adapter.initialize();
  });

  it('should allow set/get/has/remove for any CONFIG_KEYS', () => {
    Object.values(CONFIG_KEYS).forEach(key => {
      adapter.set(key, key + '_value');
      expect(adapter.get(key)).toBe(key + '_value');
      expect(adapter.has(key)).toBe(true);
      adapter.remove(key);
      expect(adapter.has(key)).toBe(false);
    });
  });

  it('refresh should do nothing and not throw', async () => {
    await expect(adapter.refresh()).resolves.toBeUndefined();
  });
});
