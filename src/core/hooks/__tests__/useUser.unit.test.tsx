// mock 必须在 import 之前
const mockUser = { id: 'u1', name: 'mock' };
const updatedUser = { id: 'u1', name: 'updated' };

import { vi } from 'vitest';

// ====== MOCK UserServiceRegistry ======
const mockUserForRegistry = { id: 'test-user', name: 'Test User' };
const mockUpdateUserForRegistry = vi.fn(async (updates) => ({ ...mockUserForRegistry, ...updates }));
vi.mock('@/core/services/business/user/registry/user-service-registry', () => ({
  UserServiceRegistry: {
    getInstance: () => ({
      getDefaultService: () => ({
        getCurrentUser: vi.fn(() => Promise.resolve(mockUserForRegistry)),
        updateUser: mockUpdateUserForRegistry,
        deleteUser: vi.fn(() => Promise.resolve()),
      }),
      createService: () => ({
        getCurrentUser: vi.fn(() => Promise.resolve(mockUserForRegistry)),
        updateUser: mockUpdateUserForRegistry,
        deleteUser: vi.fn(() => Promise.resolve()),
      }),
    }),
  },
}));

vi.mock('@/core/services/business/auth/factory/auth-events', () => {
  return {
    AuthEventManager: {
      getInstance: () => ({
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      }),
    },
  };
});
vi.mock('@/core/hooks/useAuth', () => {
  return {
    useAuth: () => ({ user: mockUser, isAuthenticated: true }),
  };
});

beforeAll(() => {
  (global as any).Registry = {
    get: vi.fn(() => ({
      getCurrentUser: vi.fn(() => Promise.resolve(mockUser)),
      updateUser: vi.fn(() => Promise.resolve(updatedUser)),
    })),
  };
});

// mock 完成后再 import 源码
import { renderHook, act } from '@testing-library/react';
import { useUser } from '@/core/hooks/useUser';
import React from 'react';

describe('useUser 复杂场景单元测试', () => {
  function MockProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  it('正常流程：能获取并更新用户', async () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: MockProvider,
    });
    // renderHook 后立即打印 result.current
    // eslint-disable-next-line no-console
    console.log('[useUser test] after renderHook:', result.current);
    await act(async () => {
      await result.current.reloadUser();
    });
    let retries = 10;
    while (!result.current.user && retries > 0) {
      // eslint-disable-next-line no-console
      console.log('[useUser test] waiting user, retries left:', retries, 'current:', result.current.user);
      await act(async () => { await Promise.resolve(); });
      retries--;
    }
    // eslint-disable-next-line no-console
    console.log('[useUser test] final user:', result.current.user);
    expect(result.current.user).toBeDefined();
    let updated;
    await act(async () => {
      updated = await result.current.updateUser({ name: 'updated' });
    });
    expect(updated && updated.name).toBe('updated');
  });

  it('异常分支：服务抛错时 fetchError 字段应有值', async () => {
    (global as any).Registry.get = vi.fn(() => ({
      getCurrentUser: vi.fn(() => { throw new Error('fail'); }),
      updateUser: vi.fn(() => { throw new Error('fail'); }),
    }));
    const { result } = renderHook(() => useUser(), {
      wrapper: MockProvider,
    });
    await act(async () => {
      await result.current.reloadUser();
    });
    expect(result.current.fetchError).toBeDefined();
  });

  it('边界场景：无用户时 empty 应为 true', async () => {
    (global as any).Registry.get = vi.fn(() => ({
      getCurrentUser: vi.fn(() => Promise.resolve(null)),
      updateUser: vi.fn(() => Promise.resolve(null)),
    }));
    const { result } = renderHook(() => useUser(), {
      wrapper: MockProvider,
    });
    await act(async () => {
      await result.current.reloadUser();
    });
    expect(result.current.empty).toBe(true);
  });
});
