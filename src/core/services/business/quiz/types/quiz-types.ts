// quiz 类型定义与接口，迁移自 deprecated/quiz/types/quiz-service.ts 及 db/types/quiz.types.ts
import type { Quiz, QuizQuestion, QuizResult, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz.types';
import { QuizServiceType } from '@/core/lib/db/types/common';

// repository 只负责核心数据访问
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

// adapter 负责聚合和扩展逻辑
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
}

export interface IQuizService {
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
  getQuizWithQuestions(quizId: string): Promise<QuizWithQuestions>;
  getUserQuizDetail(userId: string, quizId: string): Promise<UserQuizDetail>;
}

// 新增类型定义，补全类型缺失
export type QuizWithQuestions = {
  quiz: Quiz | null;
  questions: QuizQuestion[];
};

export type UserQuizDetail = {
  quiz: Quiz | null;
  result: QuizResult | null;
  questions: QuizQuestion[];
};