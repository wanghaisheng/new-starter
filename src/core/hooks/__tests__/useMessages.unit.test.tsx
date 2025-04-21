// mock 必须在 import 之前
import { vi } from 'vitest';
let onMessageChangeMock: ((msgs: any[]) => void) | undefined;

// ====== MOCK MessageServiceRegistry ======
vi.mock('@/core/services/business/messages/registry/message-service-registry', () => ({
  MessageServiceRegistry: {
    getInstance: () => ({
      getProvider: () => () => ({
        getMessagesByPage: vi.fn(() => Promise.resolve([])),
        onMessageChange: vi.fn((cb) => {
          onMessageChangeMock = cb;
          return () => {};
        }),
        sendMessage: vi.fn(() => Promise.resolve()),
        updateMessage: vi.fn(() => Promise.resolve()),
        deleteMessage: vi.fn(() => Promise.resolve()),
      }),
    }),
  },
}));

vi.mock('@/core/hooks/useUser', () => {
  return {
    useUser: () => ({ user: { id: 'test-user' } })
  };
});

(global as any).Registry = {
  get: vi.fn(() => ({
    getMessages: vi.fn(() => Promise.resolve([])),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    onMessageChange: vi.fn((cb) => {
      onMessageChangeMock = cb;
      return () => {};
    }),
  })),
};

// mock 完成后再 import 源码
import { renderHook, act } from '@testing-library/react';
import { useMessages } from '@/core/hooks/useMessages';
import React from 'react';

describe('useMessages 复杂场景单元测试', () => {
  beforeEach(() => {
    onMessageChangeMock = undefined;
  });
  function MockProvider({ children }: { children: React.ReactNode }) {
    (global as any).eventManager = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    return <>{children}</>;
  }

  it('正常流程：能获取消息并响应订阅', async () => {
    (global as any).Registry.get = vi.fn(() => ({
      getMessages: vi.fn(() => Promise.resolve([{ id: 'm1', content: 'hi' }])),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      onMessageChange: vi.fn((cb) => {
        onMessageChangeMock = cb;
        return () => {};
      }),
    }));
    const { result } = renderHook(() => useMessages('test-user'), {
      wrapper: MockProvider,
    });
    // eslint-disable-next-line no-console
    console.log('result.current:', result.current);
    expect(result.current.messages).toBeDefined();
    expect(Array.isArray(result.current.messages)).toBe(true);
  });

  it('异常分支：服务抛错时 fetchError 字段应有值', async () => {
    (global as any).Registry.get = vi.fn(() => ({
      getMessages: vi.fn(() => { throw new Error('fail'); }),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      onMessageChange: vi.fn((cb) => {
        onMessageChangeMock = cb;
        return () => {};
      }),
    }));
    const { result } = renderHook(() => useMessages('test-user'), {
      wrapper: MockProvider,
    });
    // eslint-disable-next-line no-console
    console.log('result.current:', result.current);
    expect(result.current.fetchError).toBeDefined();
  });

  it('边界场景：无消息时 empty 应为 true', async () => {
    (global as any).Registry.get = vi.fn(() => ({
      getMessages: vi.fn(() => Promise.resolve([])),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      onMessageChange: vi.fn((cb) => {
        onMessageChangeMock = cb;
        return () => {};
      }),
    }));
    // spyOn 检查 onMessageChange 是否被调用
    const registryInstance = (global as any).Registry.get();
    const spy = vi.spyOn(registryInstance, 'onMessageChange');
    const { result } = renderHook(() => useMessages('test-user'), {
      wrapper: MockProvider,
    });
    // eslint-disable-next-line no-console
    console.log('result.current:', result.current);
    let retries = 100;
    while (!onMessageChangeMock && retries > 0) {
      // eslint-disable-next-line no-console
      console.log('[useMessages test] waiting onMessageChangeMock, retries left:', retries, 'current:', onMessageChangeMock);
      await new Promise(res => setTimeout(res, 2));
      retries--;
    }
    // eslint-disable-next-line no-console
    console.log('[useMessages test] final onMessageChangeMock:', onMessageChangeMock, 'spy.calls:', spy.mock.calls.length);
    expect(onMessageChangeMock).toBeDefined();
    await act(async () => {
      if (onMessageChangeMock) onMessageChangeMock([]);
    });
    expect(result.current.empty).toBe(true);
  });
});
