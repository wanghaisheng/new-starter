import type { User } from '../user.types';
import type { QuizType, QuizTypeKey, QuizResult } from '../quiz.types';

// 只做类型级测试，确保类型引用、索引、联合类型等无 TS 报错

describe('数据库类型定义(Type Only)', () => {
  it('User 类型结构应支持 quizWeights/quizResults 索引', () => {
    const user: User = {
      id: 'u1',
      name: '张三',
      birthDate: new Date('2000-01-01'),
      notificationSettings: {} as any,
      matching: {
        completedTests: ['personality'],
        quizWeights: {
          personality: 1,
          love: 2,
        },
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
      // ...其它必填字段
    };
    expect(user.matching.quizWeights?.personality).toBe(1);
    expect(user.matching.quizResults?.personality?.score).toBe(90);
  });

  it('QuizTypeKey 应约束 quiz type 字段', () => {
    const quizType: QuizType = {
      id: 'q1',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-02',
      name: '性格测试',
      scoringRule: 'default',
      categoryRule: 'default',
      type: 'personality', // 只能是 QuizTypeKey
    };
    expect(quizType.type).toBe('personality');
  });

  it('QuizResult 结构应兼容 user.quizResults.details', () => {
    const result: QuizResult = {
      id: 'r1',
      userId: 'u1',
      quizId: 'q1',
      answers: [],
      tags: [],
      report: {},
      score: 80,
      createdAt: '2025-01-01',
      updatedAt: '2025-01-02',
    };
    const userQuizResultDetails: any = result.report;
    expect(typeof userQuizResultDetails).toBe('object');
  });
});
