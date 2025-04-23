import type { SkinConfig } from '../skin.types';

describe('SkinConfig 类型定义', () => {
  it('结构应包含 id/version/items', () => {
    const s: SkinConfig = { id: 'skin1', createdAt: '', version: 'v1', items: [], updatedAt: '', updatedBy: '' };
    expect(s.version).toBe('v1');
  });
});
