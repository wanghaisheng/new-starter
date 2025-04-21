import { describe, it, expect } from 'vitest';
import * as coreLib from '@/core/lib';

describe('core/lib smoke test', () => {
  it('should load core/lib module without error', () => {
    expect(coreLib).toBeDefined();
    // 可根据实际导出补充更细致断言
  });
});
