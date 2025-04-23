import type { Gift } from '../gift.types';

describe('Gift 类型定义', () => {
  it('Gift 结构应包含 id/name/value', () => {
    const gift: Gift = { id: 'g1', name: '玫瑰', value: 10 };
    expect(gift.value).toBe(10);
  });
});
