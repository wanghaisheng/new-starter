import { ConfigService, ConfigChangeCallback } from './config-service';

// Mock ConfigAdapter for testing
class MockConfigAdapter {
  private store: Record<string, any> = {};
  async initialize() {}
  get<T = any>(key: string): T | undefined { return this.store[key]; }
  set<T = any>(key: string, value: T) { this.store[key] = value; }
  has(key: string): boolean { return key in this.store; }
  remove(key: string) { delete this.store[key]; }
  async refresh() { this.store['REFRESHED'] = true; }
}

describe('ConfigService', () => {
  let service: ConfigService;
  beforeEach(() => {
    service = ConfigService.getInstance(new MockConfigAdapter() as any);
  });

  it('should get/set/has/remove config values', () => {
    service.set('FOO', 'bar');
    expect(service.get('FOO')).toBe('bar');
    expect(service.has('FOO')).toBe(true);
    service.remove('FOO');
    expect(service.has('FOO')).toBe(false);
  });

  it('should support variable change subscription', () => {
    const cb = jest.fn();
    service.subscribe('HELLO', cb);
    service.set('HELLO', 'world');
    expect(cb).toHaveBeenCalledWith('world', undefined);
    service.unsubscribe('HELLO', cb);
    service.set('HELLO', 'again');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('should support refresh and notify changes', async () => {
    service.set('REFRESHED', false);
    const cb = jest.fn();
    service.subscribe('REFRESHED', cb);
    await service.refresh();
    expect(cb).toHaveBeenCalledWith(true, false);
  });
});
