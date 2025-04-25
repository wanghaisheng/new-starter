import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigProviderType, getConfigService, getConfigAdapter, registerConfigAdapter, unregisterConfigAdapter } from './factory/config-factory';
import { EnvConfigAdapter } from './adapters/env-config-adapter';
import { MockConfigAdapter } from './adapters/mock-config-adapter';
import { RemoteConfigAdapter } from './adapters/remote-config-adapter';
import { CONFIG_KEYS } from './config-keys';

// 兼容 Node/浏览器测试环境
const origEnv = { ...process.env };

describe('ConfigService/Factory/Adapter 全功能特性', () => {
  beforeEach(() => {
    unregisterConfigAdapter('custom');
    // @ts-ignore
    if (getConfigService().__test_resetInstance) getConfigService().__test_resetInstance();
    Object.assign(process.env, origEnv); // 重置环境变量
  });
  afterEach(() => {
    vi.restoreAllMocks();
    Object.assign(process.env, origEnv);
  });

  it('ENV 适配器应能读取 process.env', async () => {
    process.env[CONFIG_KEYS.LOGGER_PROVIDER] = 'env-test';
    const adapter = new EnvConfigAdapter();
    await adapter.initialize();
    expect(adapter.get(CONFIG_KEYS.LOGGER_PROVIDER)).toBe('env-test');
  });

  it('Mock 适配器应支持任意 key 的 set/get/remove', async () => {
    const adapter = new MockConfigAdapter();
    await adapter.initialize();
    adapter.set('foo', 123);
    expect(adapter.get('foo')).toBe(123);
    adapter.remove('foo');
    expect(adapter.get('foo')).toBeUndefined();
  });

  it('Remote 适配器初始化应自动拉取远程配置并能 refresh', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ [CONFIG_KEYS.LOGGER_PROVIDER]: 'remote-value' }) }));
    const adapter = new RemoteConfigAdapter();
    await adapter.initialize();
    expect(adapter.get(CONFIG_KEYS.LOGGER_PROVIDER)).toBe('remote-value');
    await adapter.refresh();
    expect(adapter.get(CONFIG_KEYS.LOGGER_PROVIDER)).toBe('remote-value');
  });

  it('ConfigService 支持 set/get/remove/has/refresh', async () => {
    const service = getConfigService(ConfigProviderType.MOCK);
    service.set('bar', 'baz');
    expect(service.get('bar')).toBe('baz');
    expect(service.has('bar')).toBe(true);
    service.remove('bar');
    expect(service.has('bar')).toBe(false);
    if (typeof service.refresh === 'function') await service.refresh();
  });

  it('支持注册自定义适配器', () => {
    class CustomAdapter extends MockConfigAdapter {
      override get<T = any>(key: string): T | undefined { return (`custom-${key}` as unknown) as T; }
    }
    registerConfigAdapter('custom', () => new CustomAdapter());
    const adapter = getConfigAdapter('custom');
    expect(adapter?.get('foo')).toBe('custom-foo');
    unregisterConfigAdapter('custom');
  });

  it('ConfigService 事件机制应能推送变更', async () => {
    const service = getConfigService(ConfigProviderType.MOCK);
    let changed = false;
    const handler = (_newVal: any) => { changed = true; };
    service.subscribe('foo', handler);
    service.set('foo', 1);
    expect(changed).toBe(true);
    service.unsubscribe('foo', handler);
  });

  it('ConfigFactory fallback 逻辑与类型安全', async () => {
    unregisterConfigAdapter('not-exist');
    expect(() => getConfigService('not-exist' as any)).not.toThrow();
  });

  it('ConfigProviderType 枚举应包含 ENV、MOCK、REMOTE、DEFAULT', () => {
    expect(Object.values(ConfigProviderType)).toEqual(
      expect.arrayContaining(['env', 'mock', 'remote', 'default'])
    );
  });
});
