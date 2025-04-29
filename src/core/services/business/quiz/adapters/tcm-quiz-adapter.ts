// TCMQuizAdapter：中医体质测评专用适配器，可扩展 TCM 专属逻辑
import { QuizAdapter } from './quiz-adapter';
import type { IQuizRepository } from '../types/quiz-types';
import type { QuizResult } from '@/core/lib/db/types/quiz.types';

export class TCMQuizAdapter extends QuizAdapter {
  constructor(repository: IQuizRepository) {
    super(repository);
  }
  // 可扩展：TCM 体质专属的体质分析、健康建议逻辑
  async saveQuizResult(result: QuizResult): Promise<QuizResult> {
    // TODO: 实现 TCM 体质专属分析逻辑
    return super.saveQuizResult(result);
  }
}
