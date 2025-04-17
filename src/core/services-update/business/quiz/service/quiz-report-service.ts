import { Quiz, QuizType, QuizQuestion, QuizAnswer, QuizResult } from '@/core/lib/db/types/quiz';
import { calculateQuizScore, classifyQuizResult } from '../utils/quiz-score-utils';

/**
 * 生成测评报告及标签
 */
export function generateQuizReport(
  quiz: Quiz,
  quizType: QuizType,
  answers: QuizAnswer[],
): { score: number; tags: string[]; report: any } {
  const score = calculateQuizScore(quizType, quiz.questions, answers);
  const tags = classifyQuizResult(quizType, score, answers);
  // 可扩展更复杂的报告结构
  const report = {
    quizId: quiz.id,
    quizType: quizType.id,
    score,
    tags,
    answers,
    generatedAt: new Date().toISOString(),
  };
  return { score, tags, report };
}
