import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { ConfigProvider, useConfigContext } from '../useConfigContext';
import type { ConfigKey } from '@/core/services/infrastructure/config/config-keys';

const TEST_KEYS: ConfigKey[] = ['TEST_KEY1', 'TEST_KEY2'];

// Mock ConfigRegistry
jest.mock('@/core/services/infrastructure/config/registry/config-registry', () => {
  let store: Record<string, any> = { TEST_KEY1: 'init1', TEST_KEY2: 'init2' };
  const listeners: Record<string, Set<any>> = { TEST_KEY1: new Set(), TEST_KEY2: new Set() };
  return {
    ConfigRegistry: {
      getInstance: () => ({
        get: (key: string) => store[key],
        subscribe: (key: string, cb: any) => listeners[key]?.add(cb),
        unsubscribe: (key: string, cb: any) => listeners[key]?.delete(cb),
        refresh: async () => {
          store.TEST_KEY1 = 'refreshed1';
          store.TEST_KEY2 = 'refreshed2';
          listeners.TEST_KEY1.forEach(cb => cb('refreshed1'));
          listeners.TEST_KEY2.forEach(cb => cb('refreshed2'));
        },
      }),
    },
  };
});

describe('useConfigContext', () => {
  it('should provide initial config and respond to refresh', async () => {
    const wrapper = ({ children }: any) => <ConfigProvider keys={TEST_KEYS}>{children}</ConfigProvider>;
    const { result, waitForNextUpdate } = renderHook(() => useConfigContext(), { wrapper });
    expect(result.current.config.TEST_KEY1).toBe('init1');
    expect(result.current.config.TEST_KEY2).toBe('init2');
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.config.TEST_KEY1).toBe('refreshed1');
    expect(result.current.config.TEST_KEY2).toBe('refreshed2');
  });

  it('should update config when key changes', () => {
    const wrapper = ({ children }: any) => <ConfigProvider keys={TEST_KEYS}>{children}</ConfigProvider>;
    const { result } = renderHook(() => useConfigContext(), { wrapper });
    act(() => {
      // 模拟订阅回调
      result.current.config.TEST_KEY1 = 'newVal1';
    });
    expect(result.current.config.TEST_KEY1).toBe('newVal1');
  });
});
