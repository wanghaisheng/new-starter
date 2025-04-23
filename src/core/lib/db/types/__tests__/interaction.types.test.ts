import type { Report } from '../interaction.types';

describe('Interaction 类型定义', () => {
  it('Report 结构应包含 reporterId/targetUserId', () => {
    const report: Report = { id: 'r1', reporterId: 'u1', targetUserId: 'u2', reason: 'spam', status: 'pending', createdAt: '', updatedAt: '' };
    expect(report.status).toBe('pending');
  });
});
