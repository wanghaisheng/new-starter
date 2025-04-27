import { IQuizReportAdapter } from './report-adapter';
import { MockReportAdapter } from './mock-report-adapter';
import { DefaultReportAdapter } from './default-report-adapter';
import { Quiz, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz';

/**
 * 混合 Report Adapter：本地优先，远程兜底
 */
export class HybridReportAdapter implements IQuizReportAdapter {
  private mock: MockReportAdapter;
  private remote: DefaultReportAdapter;
  constructor() {
    this.mock = new MockReportAdapter();
    this.remote = new DefaultReportAdapter();
  }
  generateQuizReport(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[]
  ) {
    try {
      const local = this.mock.generateQuizReport(quiz, quizType, answers);
      if (local) return local;
    } catch {}
    return this.remote.generateQuizReport(quiz, quizType, answers);
  }
}
