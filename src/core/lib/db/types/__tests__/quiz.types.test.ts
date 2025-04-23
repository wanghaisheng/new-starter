import type { QuizType, QuizTypeKey, Quiz, QuizResult } from '../quiz.types';

describe('Quiz 类型定义', () => {
  it('QuizTypeKey 联合类型应可用', () => {
    const key: QuizTypeKey = 'personality';
    expect(key).toBe('personality');
  });
  it('Quiz 结构应包含 id/title/type/questions', () => {
    const quiz: Quiz = { id: 'q1', title: '测试', type: { id: 'qt1', createdAt: '', updatedAt: '', name: '', scoringRule: '', categoryRule: '', type: 'personality' }, questions: [], createdAt: '', updatedAt: '' };
    expect(quiz.type.type).toBe('personality');
  });
  it('QuizResult 结构应兼容', () => {
    const result: QuizResult = { id: 'r1', userId: 'u1', quizId: 'q1', answers: [], tags: [], report: {}, score: 80, createdAt: '', updatedAt: '' };
    expect(result.score).toBe(80);
  });
});
