// quiz 核心业务逻辑实现，迁移自 deprecated/quiz/service/quiz-service.ts
import type { IQuizAdapter, IQuizService } from '../types/quiz-types';
import type { Quiz, QuizQuestion, QuizResult } from '@/core/lib/db/types/quiz.types';

export class QuizService implements IQuizService {
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
  async getQuizWithQuestions(quizId: string) {
    const quiz = await this.getQuiz(quizId);
    const questions = await this.getQuizQuestions(quizId);
    return { quiz, questions };
  }
  async getUserQuizDetail(userId: string, quizId: string) {
    const quiz = await this.getQuiz(quizId);
    const result = await this.getQuizResult(userId, quizId);
    const questions = await this.getQuizQuestions(quizId);
    return { quiz, result, questions };
  }
}