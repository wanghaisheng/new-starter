// 示例 QuizEnhancer 实现，可根据需要扩展
import type { IQuizEnhancer } from '../service/quiz-service';
import type { QuizResult } from '@/core/lib/db/types/quiz.types';

export class DemoEnhancer implements IQuizEnhancer {
  async beforeSave(result: QuizResult): Promise<QuizResult> {
    // 可在此添加保存前的处理逻辑，如自动打标签、内容安全检测等
    return result;
  }
  async afterSave(result: QuizResult): Promise<void> {
    // 可在此添加保存后的处理逻辑，如推送通知、埋点、AI 分析等
    return;
  }
}
