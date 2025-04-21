import { Quiz, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz';
import type { IQuizReportService, IQuizReportAdapter } from '../types/quiz-service';

/**
 * QuizReportService 实现 IQuizReportService，生成测评报告及标签
 */
export class QuizReportService implements IQuizReportService {
  private reportAdapter: IQuizReportAdapter;
  constructor(reportAdapter: IQuizReportAdapter) {
    this.reportAdapter = reportAdapter;
  }
  generateQuizReport(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[]
  ): { score: number; tags: string[]; report: any } {
    return this.reportAdapter.generateQuizReport(quiz, quizType, answers);
  }
}
