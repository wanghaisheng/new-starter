// quiz repository 层实现，负责所有 quiz 相关核心数据访问逻辑
// 仅做数据操作，不涉及聚合和扩展逻辑
import type { Quiz, QuizQuestion, QuizResult } from '@/core/lib/db/types/quiz.types';
import { BaseRepository } from './base-repository';
import { EntityConverter } from '@/core/lib/db/schema/entity-converter';
import quizSchema from '@/core/lib/db/schema/definitions/quiz-schema';
import type { BaseClient } from '../../clients/base-client';

export class QuizRepository extends BaseRepository<Quiz> {
  constructor(client: BaseClient<Quiz>) {
    super(client, quizSchema.name, new EntityConverter<Quiz>(quizSchema));
  }
  // 可在此扩展 quiz 专属方法，如 findByUserId、findByType 等
}

// 保留接口定义，便于多实现切换和类型约束
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