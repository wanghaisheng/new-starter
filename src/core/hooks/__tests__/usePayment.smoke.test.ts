import { renderHook } from '@testing-library/react';
import { usePayment } from '@/core/hooks/usePayment';
import { vi } from 'vitest';
import React from 'react';

vi.mock('@/core/services/business/payment/service/payment-service', () => ({
  PaymentService: vi.fn().mockImplementation(() => ({
    getProducts: vi.fn(() => Promise.resolve([{ id: 'p1', name: 'mock' }]))
  }))
}));

describe('usePayment smoke test', () => {
  it('should not throw and return an object with loading/error/empty', async () => {
    const { result } = renderHook(() => usePayment(), {});
    expect(result.current).toBeDefined();
    expect(typeof result.current.loading).toBe('boolean');
    expect('error' in result.current).toBe(true);
    expect('empty' in result.current).toBe(true);
    if (!result.current.loading && !result.current.error) {
      expect(Array.isArray(result.current.products)).toBe(true);
    }
  });
});
