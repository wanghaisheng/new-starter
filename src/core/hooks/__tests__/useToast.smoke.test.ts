import { renderHook } from '@testing-library/react';
import { useToast } from '@/core/hooks/useToast';
import React from 'react';
import { vi } from 'vitest';

function MockProvider({ children }) {
  (global).eventManager = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
  return children;
}

describe('useToast smoke test', () => {
  it('should not throw and return an object with triggerToast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: MockProvider,
    });
    expect(result.current).toBeDefined();
    expect('triggerToast' in result.current).toBe(true);
    expect(typeof result.current.triggerToast).toBe('function');
  });
});
