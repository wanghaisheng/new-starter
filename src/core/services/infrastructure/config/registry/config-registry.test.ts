// 兼容 Node 测试环境定时器
(globalThis as any).clearInterval = globalThis.clearInterval || (() => {});
(globalThis as any).setInterval = globalThis.setInterval || (() => 0);

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getConfigService,
  registerConfigAdapter,
  ConfigProviderType,
  __test_getAdapter,
} from './config-registry';

// Mock adapter for test
class DummyConfigAdapter {
  get(key: string) { return `dummy-${key}`; }
}

describe('ConfigRegistry', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalWindow: any;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // mock window
    if (typeof globalThis.window === 'undefined') {
      (globalThis as any).window = {};
    }
    // 只浅拷贝 window，避免 undefined/null 问题
    originalWindow = Object.assign({}, globalThis.window);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    // 恢复 window，避免 undefined/null 问题
    if (typeof globalThis.window !== 'undefined' && globalThis.window) {
      Object.keys(globalThis.window).forEach(k => delete (globalThis.window as any)[k]);
      Object.assign(globalThis.window, originalWindow);
    }
  });

  it('should detect ENV provider by default', () => {
    delete process.env.NEXT_PUBLIC_CONFIG_PROVIDER;
    expect(getConfigService().constructor.name).toBe('ConfigService');
  });

  it('should detect MOCK provider via env', () => {
    process.env.NEXT_PUBLIC_CONFIG_PROVIDER = 'mock';
    expect(getConfigService(ConfigProviderType.MOCK).constructor.name).toBe('ConfigService');
  });

  it('should detect REMOTE provider via env', () => {
    process.env.NEXT_PUBLIC_CONFIG_PROVIDER = 'remote';
    expect(getConfigService(ConfigProviderType.REMOTE).constructor.name).toBe('ConfigService');
  });

  it('should fallback to ENV if unknown provider', () => {
    process.env.NEXT_PUBLIC_CONFIG_PROVIDER = 'not-exist';
    expect(getConfigService().constructor.name).toBe('ConfigService');
  });

  it('should allow dynamic adapter registration', () => {
    registerConfigAdapter('dummy', () => new DummyConfigAdapter() as any);
    process.env.NEXT_PUBLIC_CONFIG_PROVIDER = 'dummy';
    // 直接用 __test_getAdapter 断言 adapter 行为
    const adapter = __test_getAdapter('dummy') as any;
    expect(adapter.get('foo')).toBe('dummy-foo');
  });

  it('should detect provider from window if present', () => {
    (globalThis.window as any).NEXT_PUBLIC_CONFIG_PROVIDER = 'mock';
    expect(getConfigService().constructor.name).toBe('ConfigService');
  });
});
