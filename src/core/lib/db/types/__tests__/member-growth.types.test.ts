import type { MemberGrowth } from '../member-growth.types';

describe('MemberGrowth 类型定义', () => {
  it('结构应包含 userId/level/exp', () => {
    const m: MemberGrowth = { id: 'm1', userId: 'u1', level: 2, exp: 100 };
    expect(m.level).toBe(2);
  });
});
