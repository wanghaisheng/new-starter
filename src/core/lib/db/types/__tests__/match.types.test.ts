import type { Match } from '../match.types';

describe('Match 类型定义', () => {
  it('Match 结构应包含 id/userId/matchedUserId', () => {
    const m: Match = { id: 'm1', userId: 'u1', matchedUserId: 'u2', createdAt: '', updatedAt: '' };
    expect(m.userId).toBe('u1');
  });
});
