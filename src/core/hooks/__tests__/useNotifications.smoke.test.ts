import { renderHook } from '@testing-library/react';
import { useNotifications } from '@/core/hooks/useNotifications';
import { vi } from 'vitest';
import React from 'react';

vi.mock('@/core/services/business/notifications/service/notification-service', () => ({
  NotificationService: vi.fn().mockImplementation(() => ({
    getUserNotifications: vi.fn(() => Promise.resolve([{ id: 'n1', content: 'mock' }]))
  }))
}));

describe('useNotifications smoke test', () => {
  it('should not throw and return an object with loading/error/empty', async () => {
    const { result } = renderHook(() => useNotifications('test-user'), {});
    expect(result.current).toBeDefined();
    expect(typeof result.current.loading).toBe('boolean');
    expect('error' in result.current).toBe(true);
    expect('empty' in result.current).toBe(true);
    if (!result.current.loading && !result.current.error) {
      expect(Array.isArray(result.current.notifications)).toBe(true);
    }
  });
});
