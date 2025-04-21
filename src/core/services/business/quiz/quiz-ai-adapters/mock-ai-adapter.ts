import { IAIAdapter } from './ai-adapter';
import { Quiz, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz';

export class MockAIAdapter implements IAIAdapter {
  async analyzeQuizWithAI(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[],
    model?: string,
    extraPrompt?: string
  ) {
    // 返回固定结构的 mock AI 结果，便于前端和测试联调
    return {
      result: JSON.stringify({
        tags: ['mocked', 'ai', 'test'],
        report: {
          summary: '这是模拟AI分析报告，仅用于测试环境。',
          quizTitle: quiz?.title || '',
          answerCount: answers.length,
          model: model || 'mock-model',
          extraPrompt: extraPrompt || ''
        }
      }),
      raw: {
        mocked: true,
        quizId: quiz?.id,
        quizType: quizType?.id,
        answers
      }
    };
  }
}
