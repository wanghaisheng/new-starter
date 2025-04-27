import { IQuizReportAdapter } from './report-adapter';
import { Quiz, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz';
import { calculateQuizScore, classifyQuizResult } from '../utils/quiz-score-utils';

export class DefaultReportAdapter implements IQuizReportAdapter {
  generateQuizReport(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[]
  ): { score: number; tags: string[]; report: any } {
    const score = calculateQuizScore(quizType, quiz.questions, answers);
    const tags = classifyQuizResult(quizType, score, answers);
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
}
