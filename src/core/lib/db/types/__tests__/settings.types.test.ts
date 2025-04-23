import type { Settings } from '../settings.types';

describe('Settings 类型定义', () => {
  it('结构应包含 id/userId', () => {
    const s: Settings = { id: 's1', userId: 'u1', createdAt: '', updatedAt: '' };
    expect(s.userId).toBe('u1');
  });
});
