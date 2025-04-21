import { describe, it, expect } from 'vitest';

describe('API integration smoke test', () => {
  it('should load API routes without error', () => {
    expect(() => require('@/api')).not.toThrow();
  });
});
