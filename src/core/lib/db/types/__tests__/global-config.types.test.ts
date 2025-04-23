import type { GlobalConfig } from '../global-config.types';

describe('GlobalConfig 类型定义', () => {
  it('GlobalConfig 结构应包含 id/version/items', () => {
    const cfg: GlobalConfig = { id: 'c1', createdAt: '', version: '', items: [], updatedAt: '', updatedBy: '' };
    expect(cfg.items).toBeInstanceOf(Array);
  });
});
