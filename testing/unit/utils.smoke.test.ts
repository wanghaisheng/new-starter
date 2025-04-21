import { describe, it, expect } from 'vitest';
import * as utils from '@/core/utils';

describe('utils smoke test', () => {
  it('should load utils module without error', () => {
    expect(utils).toBeDefined();
    expect(typeof utils.cn).toBe('function');
  });
});
