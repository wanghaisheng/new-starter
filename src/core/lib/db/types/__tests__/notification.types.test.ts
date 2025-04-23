import type { Notification } from '../notification.types';

describe('Notification 类型定义', () => {
  it('结构应包含 id/userId/type', () => {
    const n: Notification = { id: 'n1', userId: 'u1', type: 'info', createdAt: '', updatedAt: '' };
    expect(n.type).toBe('info');
  });
});
