import { IQuizReportAdapter } from './report-adapter';
import { Quiz, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz';

export class MockReportAdapter implements IQuizReportAdapter {
  generateQuizReport(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[]
  ) {
    // 返回固定结构的 mock 报告，便于前端和测试联调
    return {
      score: 42,
      tags: ['mocked', 'report', 'test'],
      report: {
        quizId: quiz?.id,
        quizType: quizType?.id,
        summary: '这是模拟报告，仅用于测试环境。',
        answerCount: answers.length,
        generatedAt: new Date().toISOString(),
        mock: true
      }
    };
  }
}
