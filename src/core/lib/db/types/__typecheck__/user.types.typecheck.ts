import type { User } from '../user.types';

// 正确用法：应无类型报错
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

// 错误用法：应有类型报错
// @ts-expect-error
user.matching.quizWeights.unknownKey = 123;

// 错误用法：缺少必填字段
// @ts-expect-error
const user2: User = { id: 'u2' };
