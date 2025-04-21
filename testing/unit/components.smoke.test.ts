import { describe, it, expect } from 'vitest';
import * as components from '@/core/components';

describe('components smoke test', () => {
  it('should load components module without error', () => {
    expect(components).toBeDefined();
    // 可根据实际导出补充更细致断言
  });
});
