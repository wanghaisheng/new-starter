import { IQuizAdapter } from '../adapters/quiz-adapter';
import { Quiz, QuizResult, QuizQuestion } from '@/core/lib/db/types/quiz';

export class QuizDataService {
  private adapter: IQuizAdapter;
  constructor(adapter: IQuizAdapter) {
    this.adapter = adapter;
  }
  getQuizzes(): Promise<Quiz[]> {
    return this.adapter.getQuizzes();
  }
  getQuiz(quizId: string): Promise<Quiz | null> {
    return this.adapter.getQuiz(quizId);
  }
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return this.adapter.getQuizQuestions(quizId);
  }
  getQuizResult(userId: string, quizId: string): Promise<QuizResult | null> {
    return this.adapter.getQuizResult(userId, quizId);
  }
  saveQuizResult(result: QuizResult): Promise<QuizResult> {
    return this.adapter.saveQuizResult(result);
  }
  getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return this.adapter.getUserQuizResults(userId);
  }
  getQuizAllResults(quizId: string): Promise<QuizResult[]> {
    return this.adapter.getQuizAllResults(quizId);
  }
  saveQuizResults(results: QuizResult[]): Promise<QuizResult[]> {
    return this.adapter.saveQuizResults(results);
  }
  deleteQuizResult(resultId: string): Promise<void> {
    return this.adapter.deleteQuizResult(resultId);
  }
  updateQuizResult(resultId: string, data: Partial<QuizResult>): Promise<QuizResult> {
    return this.adapter.updateQuizResult(resultId, data);
  }
}
