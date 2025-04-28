// QuizAdapter 实现，聚合和扩展逻辑，依赖 repository
import type { IQuizAdapter, IQuizRepository } from '../types/quiz-types';
import type { Quiz, QuizQuestion, QuizResult } from '@/core/lib/db/types/quiz.types';

export class QuizAdapter implements IQuizAdapter {
  private repository: IQuizRepository;

  constructor(repository: IQuizRepository) {
    this.repository = repository;
  }

  getQuizzes(): Promise<Quiz[]> {
    return this.repository.getQuizzes();
  }
  getQuiz(quizId: string): Promise<Quiz | null> {
    return this.repository.getQuiz(quizId);
  }
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return this.repository.getQuizQuestions(quizId);
  }
  getQuizResult(userId: string, quizId: string): Promise<QuizResult | null> {
    return this.repository.getQuizResult(userId, quizId);
  }
  saveQuizResult(result: QuizResult): Promise<QuizResult> {
    return this.repository.saveQuizResult(result);
  }
  getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return this.repository.getUserQuizResults(userId);
  }
  getQuizAllResults(quizId: string): Promise<QuizResult[]> {
    return this.repository.getQuizAllResults(quizId);
  }
  saveQuizResults(results: QuizResult[]): Promise<QuizResult[]> {
    return this.repository.saveQuizResults(results);
  }
  deleteQuizResult(resultId: string): Promise<void> {
    return this.repository.deleteQuizResult(resultId);
  }
  updateQuizResult(resultId: string, data: Partial<QuizResult>): Promise<QuizResult> {
    return this.repository.updateQuizResult(resultId, data);
  }
}