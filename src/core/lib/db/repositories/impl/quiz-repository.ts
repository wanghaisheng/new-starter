// quiz repository 层实现，负责所有 quiz 相关核心数据访问逻辑
// 仅做数据操作，不涉及聚合和扩展逻辑
import type { Quiz, QuizQuestion, QuizResult } from '@/core/lib/db/types/quiz.types';

export interface IQuizRepository {
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
}

// 具体实现类可根据实际数据源（如数据库、API等）实现 IQuizRepository 接口