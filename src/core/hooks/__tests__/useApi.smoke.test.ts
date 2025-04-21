import { renderHook, act } from '@testing-library/react';
import { useApi } from '@/core/hooks/useApi';
import { vi } from 'vitest';

global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ ok: true }) }));

describe('useApi smoke test', () => {
  it('should call fetch and handle loading/error/data', async () => {
    const { result } = renderHook(() => useApi('/mock-url'));
    expect(result.current).toBeDefined();
    expect(typeof result.current.loading).toBe('boolean');
    expect('error' in result.current).toBe(true);
    expect('data' in result.current).toBe(true);
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.data).toBeDefined();
  });
});
