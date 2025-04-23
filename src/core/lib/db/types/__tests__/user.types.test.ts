import type { User } from '../user.types';

describe('User 类型定义', () => {
  it('结构应支持 quizWeights/quizResults', () => {
    const user: User = {
      id: 'u1',
      name: '张三',
      birthDate: new Date('2000-01-01'),
      notificationSettings: {} as any,
      matching: {
        completedTests: ['personality'],
        quizWeights: { personality: 1 },
        quizResults: {
          personality: {
            score: 90,
            details: { foo: 'bar' },
            lastUpdated: '2025-01-01',
          },
        },
      },
      isVerified: true,
      lastActive: new Date(),
      isOnline: false,
    };
    expect(user.matching.quizWeights?.personality).toBe(1);
    expect(user.matching.quizResults?.personality?.score).toBe(90);
  });
});
