import type { MemberGrowthTask } from '../member-growth-task.types';

describe('MemberGrowthTask 类型定义', () => {
  it('结构应包含 userId/taskId/progress', () => {
    const t: MemberGrowthTask = { id: 't1', userId: 'u1', taskId: 'taskA', status: 'done', progress: 100 };
    expect(t.progress).toBe(100);
  });
});
