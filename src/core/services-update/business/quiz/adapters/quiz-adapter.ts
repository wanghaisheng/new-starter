import { Quiz, QuizResult, QuizQuestion } from '@/core/lib/db/types/quiz';

export interface IQuizAdapter {
  getQuizzes(): Promise<Quiz[]>;
  getQuiz(quizId: string): Promise<Quiz | null>;
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]>;
  getQuizResult(userId: string, quizId: string): Promise<QuizResult | null>;
  saveQuizResult(result: QuizResult): Promise<QuizResult>;
  getUserQuizResults(userId: string): Promise<QuizResult[]>;
  getQuizAllResults(quizId: string): Promise<QuizResult[]>;
  saveQuizResults(results: QuizResult[]): Promise<QuizResult[]>;
  deleteQuizResult(resultId: string): Promise<void>;
  updateQuizResult(resultId: string, data: Partial<QuizResult>): Promise<QuizResult>;
  // 可扩展更多方法，如 getQuizWithQuestions, getUserQuizDetail, 批量删除等
}
