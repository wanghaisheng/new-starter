import { describe, it, expect } from 'vitest';

describe('Database integration smoke test', () => {
  it('should connect to mock database without error', () => {
    expect(() => require('@/core/lib/db')).not.toThrow();
  });
});
