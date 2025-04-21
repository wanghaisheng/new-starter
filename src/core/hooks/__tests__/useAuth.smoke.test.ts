import { renderHook } from '@testing-library/react';
import { useAuth } from '@/core/hooks/useAuth';
import React from 'react';
import { vi } from 'vitest';

function MockProvider({ children }: { children: React.ReactNode }) {
  (global as any).eventManager = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
  return children;
}

describe('useAuth smoke test', () => {
  it('should not throw and return an object with isLoading/error/isAuthenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: MockProvider,
    });
    expect(result.current).toBeDefined();
    expect(typeof result.current.isLoading).toBe('boolean');
    expect('error' in result.current).toBe(true);
    expect('isAuthenticated' in result.current).toBe(true);
    // 主流程 user 字段
    expect(result.current.user === null || typeof result.current.user === 'object').toBe(true);
  });
});
