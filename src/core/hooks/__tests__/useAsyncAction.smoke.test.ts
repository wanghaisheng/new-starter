import { renderHook, act } from '@testing-library/react';
import { useAsyncAction } from '@/core/hooks/useAsyncAction';
import { vi } from 'vitest';

describe('useAsyncAction smoke test', () => {
  it('should handle async action and states', async () => {
    const asyncFn = vi.fn(async (x) => x + 1);
    const { result } = renderHook(() => useAsyncAction(asyncFn));
    expect(result.current).toBeDefined();
    expect(typeof result.current.loading).toBe('boolean');
    expect('error' in result.current).toBe(true);
    expect(typeof result.current.run).toBe('function');
    let output;
    await act(async () => {
      output = await result.current.run(1);
    });
    expect(output).toBe(2);
    expect(result.current.loading).toBe(false);
  });
});
