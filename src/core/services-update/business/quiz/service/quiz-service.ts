import { QuizDataService } from '../data/quiz-data-service';
import { Quiz, QuizResult, QuizQuestion } from '@/core/lib/db/types/quiz';
import type { QuizWithQuestions, UserQuizDetail } from '../types/quiz-types';

export class QuizService {
  private dataService: QuizDataService;
  constructor(dataService: QuizDataService) {
    this.dataService = dataService;
  }
  getQuizzes(): Promise<Quiz[]> {
    return this.dataService.getQuizzes();
  }
  getQuiz(quizId: string): Promise<Quiz | null> {
    return this.dataService.getQuiz(quizId);
  }
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return this.dataService.getQuizQuestions(quizId);
  }
  getQuizResult(userId: string, quizId: string): Promise<QuizResult | null> {
    return this.dataService.getQuizResult(userId, quizId);
  }
  saveQuizResult(result: QuizResult): Promise<QuizResult> {
    return this.dataService.saveQuizResult(result);
  }
  getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return this.dataService.getUserQuizResults(userId);
  }
  getQuizAllResults(quizId: string): Promise<QuizResult[]> {
    return this.dataService.getQuizAllResults(quizId);
  }
  saveQuizResults(results: QuizResult[]): Promise<QuizResult[]> {
    return this.dataService.saveQuizResults(results);
  }
  deleteQuizResult(resultId: string): Promise<void> {
    return this.dataService.deleteQuizResult(resultId);
  }
  updateQuizResult(resultId: string, data: Partial<QuizResult>): Promise<QuizResult> {
    return this.dataService.updateQuizResult(resultId, data);
  }
  async getQuizWithQuestions(quizId: string): Promise<QuizWithQuestions> {
    const quiz = await this.getQuiz(quizId);
    const questions = await this.getQuizQuestions(quizId);
    return { quiz, questions };
  }
  async getUserQuizDetail(userId: string, quizId: string): Promise<UserQuizDetail> {
    const quiz = await this.getQuiz(quizId);
    const result = await this.getQuizResult(userId, quizId);
    const questions = await this.getQuizQuestions(quizId);
    return { quiz, result, questions };
  }
}
