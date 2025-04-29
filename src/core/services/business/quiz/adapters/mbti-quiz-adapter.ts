// MBTIQuizAdapter：MBTI 测评专用适配器，可扩展 MBTI 专属逻辑
import { QuizAdapter } from './quiz-adapter';
import type { IQuizRepository } from '../types/quiz-types';
import type { QuizResult } from '@/core/lib/db/types/quiz.types';

export class MBTIQuizAdapter extends QuizAdapter {
  constructor(repository: IQuizRepository) {
    super(repository);
  }
  // 可扩展：MBTI 专属的评分、报告生成逻辑
  async saveQuizResult(result: QuizResult): Promise<QuizResult> {
    // TODO: 实现 MBTI 专属分析逻辑
    return super.saveQuizResult(result);
  }
}
