import { vi } from 'vitest';
vi.mock('@/core/hooks/useToast', () => ({
  useToast: () => ({ triggerToast: vi.fn() })
}));
import { renderHook } from '@testing-library/react';
import { useAsyncAction } from '@/core/hooks/useAsyncAction';
import React from 'react';

// mock useToast，确保 hooks 内 triggerToast 不抛错

function MockProvider({ children }: { children: React.ReactNode }) {
  (global as any).eventManager = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
  return <>{children}</>;
}

describe('useAsyncAction smoke test', () => {
  it('should not throw and return an object', () => {
    const { result } = renderHook(() => useAsyncAction(() => Promise.resolve()), {
      wrapper: MockProvider,
    });
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('object');
    expect(typeof result.current.loading).toBe('boolean');
    expect('run' in result.current).toBe(true);
  });
});
