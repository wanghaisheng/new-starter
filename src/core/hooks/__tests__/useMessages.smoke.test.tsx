import { renderHook } from '@testing-library/react';
import { useMessages } from '@/core/hooks/useMessages';
import React from 'react';
import { vi } from 'vitest';

function MockProvider({ children }: { children: React.ReactNode }) {
  (global).Registry = {
    get: vi.fn(() => ({
      getMessages: vi.fn(() => Promise.resolve([])),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  };
  (global).useUser = vi.fn(() => ({ user: { id: 'test-user' } }));
  return <>{children}</>;
}

describe('useMessages smoke test', () => {
  it('should not throw and return an object', () => {
    const { result } = renderHook(() => useMessages('test-user'), {
      wrapper: MockProvider,
    });
    expect(result.current).toBeDefined();
  });
});
