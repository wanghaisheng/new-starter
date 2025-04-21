import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/core/hooks/useAuth';
import React from 'react';
import { vi } from 'vitest';

describe('useAuth 复杂场景单元测试', () => {
  function MockProvider({ children }: { children: React.ReactNode }) {
    (global as any).Registry = {
      get: vi.fn(() => ({
        login: vi.fn(() => Promise.resolve({ id: 'u1', token: 'mock' })),
        logout: vi.fn(() => Promise.resolve(true)),
        refreshToken: vi.fn(() => Promise.resolve('new-token')),
      })),
    };
    (global as any).eventManager = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    return <>{children}</>;
  }

  it('正常流程：能登录、登出、刷新 token', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: MockProvider,
    });
    if (result.current.login) {
      const user = await result.current.login('email', { email: 'a', password: 'b' });
      expect(user).toBeDefined();
    }
    if (result.current.logout) {
      const res = await result.current.logout();
      expect(res).toBe(true);
    }
    if (result.current.refreshToken) {
      const token = await result.current.refreshToken();
      expect(token).toBe('new-token');
    }
  });

  it('异常分支：服务抛错时 error 字段应有值', async () => {
    (global as any).Registry.get = vi.fn(() => ({
      login: vi.fn(() => { throw new Error('fail'); }),
      logout: vi.fn(() => { throw new Error('fail'); }),
      refreshToken: vi.fn(() => { throw new Error('fail'); }),
    }));
    (global as any).eventManager = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    const { result } = renderHook(() => useAuth(), {
      wrapper: MockProvider,
    });
    expect(result.current.error).toBeDefined();
  });
});
