import { describe, it, expect } from 'vitest';
import * as services from '@/core/services';

describe('services smoke test', () => {
  it('should load services module without error', () => {
    expect(services).toBeDefined();
    // 可根据实际导出补充更细致断言
  });
});
