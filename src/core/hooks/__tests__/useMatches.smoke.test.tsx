import { renderHook, act, waitFor } from '@testing-library/react';
import { useMatches } from '@/core/hooks/useMatches';
import React from 'react';
import { vi } from 'vitest';

function MockProvider({ children }: { children: React.ReactNode }) {
  (global).Registry = {
    get: vi.fn(() => ({
      getMatches: vi.fn(() => Promise.resolve([])),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  };
  (global).useUser = vi.fn(() => ({ user: { id: 'test-user' } }));
  return <>{children}</>;
}

describe('useMatches smoke test', () => {
  it('should not throw and return an object', async () => {
    let result;
    await act(async () => {
      const hook = renderHook(() => useMatches('test-user'), {
        wrapper: MockProvider,
      });
      result = hook.result;
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });
    });
  });
});
