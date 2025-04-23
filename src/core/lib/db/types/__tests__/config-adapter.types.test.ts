import type { IConfigAdapter } from '../config-adapter.types';

describe('IConfigAdapter 类型定义', () => {
  it('应支持 get/set/has/remove/refresh 方法签名', () => {
    const adapter: IConfigAdapter = {
      async initialize() {},
      async get(key) { return 'v'; },
      set(key, value) {},
      has(key) { return true; },
      remove(key) {},
      async refresh() {},
    };
    expect(adapter.has('foo')).toBe(true);
  });
});
