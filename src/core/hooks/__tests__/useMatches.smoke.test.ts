import { renderHook } from '@testing-library/react';
import { useMatches } from '@/core/hooks/useMatches';
import { vi } from 'vitest';
import React from 'react';

vi.mock('@/core/services/business/match/service/match-service', () => ({
  MatchService: vi.fn().mockImplementation(() => ({
    getMatches: vi.fn(() => Promise.resolve([{ id: 'm1', name: 'mock' }]))
  }))
}));

describe('useMatches smoke test', () => {
  it('should not throw and return an object with loading/error/empty', async () => {
    const { result } = renderHook(() => useMatches(), {});
    expect(result.current).toBeDefined();
    expect(typeof result.current.loading).toBe('boolean');
    expect('error' in result.current).toBe(true);
    expect('empty' in result.current).toBe(true);
    if (!result.current.loading && !result.current.error) {
      expect(Array.isArray(result.current.matches)).toBe(true);
    }
  });
});
