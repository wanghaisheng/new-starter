// 评分工具：用于根据测评类型和答案计算分数与分类标签
import type { QuizType, QuizQuestion, QuizAnswer } from '@/core/lib/db/types/quiz.types';

/**
 * 根据不同测评类型的评分规则计算分数
 */
export function calculateQuizScore(
  quizType: QuizType,
  questions: QuizQuestion[],
  answers: QuizAnswer[]
): number {
  // 示例：根据 quizType.scoringRule 字段选择不同算法
  switch (quizType.scoringRule) {
    case 'sum':
      return answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
    case 'average':
      if (answers.length === 0) return 0;
      return (
        answers.reduce((sum, a) => sum + (a.score ?? 0), 0) / answers.length
      );
    // 可扩展更多规则
    default:
      return answers.reduce((sum, a) => sum + (a.score ?? 0), 0);
  }
}

/**
 * 根据不同测评类型的分类规则生成标签
 */
export function classifyQuizResult(
  quizType: QuizType,
  score: number,
  answers: QuizAnswer[]
): string[] {
  // 示例：根据 quizType.categoryRule 字段分类
  switch (quizType.categoryRule) {
    case 'level':
      if (score > 80) return ['A'];
      if (score > 60) return ['B'];
      return ['C'];
    // 可扩展更多规则
    default:
      return [];
  }
}