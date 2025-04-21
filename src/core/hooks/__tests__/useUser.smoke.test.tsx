import { vi } from 'vitest';
// 必须在 import 目标模块之前 mock
vi.mock('@/core/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'mock-user' }, isAuthenticated: true })
}));
vi.mock('@/core/hooks/useToast', () => ({
  useToast: () => ({ triggerToast: vi.fn() })
}));
import { renderHook } from '@testing-library/react';
import { useUser } from '@/core/hooks/useUser';
import React from 'react';

// 提供一个最简 mock eventManager context 和 useAuth/useToast
function MockProvider({ children }: { children: React.ReactNode }) {
  (global as any).eventManager = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
  return <>{children}</>;
}

describe('useUser smoke test', () => {
  it('should not throw and return an object', () => {
    const { result } = renderHook(() => useUser(), {
      wrapper: MockProvider,
    });
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('object');
    expect(result.current.user === null || typeof result.current.user === 'object').toBe(true);
    expect(typeof result.current.loading).toBe('boolean');
    expect(typeof result.current.isAuthenticated).toBe('boolean');
  });
});
