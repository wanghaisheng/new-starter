// BaziQuizAdapter：八字命理测评专用适配器，可扩展八字专属逻辑
import { QuizAdapter } from './quiz-adapter';
import type { IQuizRepository } from '../types/quiz-types';
import type { QuizResult } from '@/core/lib/db/types/quiz.types';

export class BaziQuizAdapter extends QuizAdapter {
  constructor(repository: IQuizRepository) {
    super(repository);
  }
  // 可扩展：八字命理专属的命盘分析、报告生成逻辑
  async saveQuizResult(result: QuizResult): Promise<QuizResult> {
    // TODO: 实现八字命理专属分析逻辑
    return super.saveQuizResult(result);
  }
}
