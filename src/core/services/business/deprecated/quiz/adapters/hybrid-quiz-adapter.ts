import { MockQuizAdapter } from './mock-quiz-adapter';
import { RemoteQuizAdapter } from './remote-quiz-adapter';
import type { IQuizAdapter } from '../types/quiz-service';
import { Quiz, QuizResult, QuizQuestion } from '@/core/lib/db/types/quiz';

/**
 * 混合 Quiz 适配器（本地优先，远程兜底，可扩展同步等高级场景）
 */
export class HybridQuizAdapter implements IQuizAdapter {
  private mock: MockQuizAdapter;
  private remote: RemoteQuizAdapter;
  constructor(apiBaseUrl?: string) {
    this.mock = new MockQuizAdapter();
    this.remote = new RemoteQuizAdapter(apiBaseUrl || '');
  }
  async getQuizzes(): Promise<Quiz[]> {
    const local = await this.mock.getQuizzes();
    if (local.length > 0) return local;
    return this.remote.getQuizzes();
  }
  async getQuiz(quizId: string): Promise<Quiz | null> {
    return (await this.mock.getQuiz(quizId)) || this.remote.getQuiz(quizId);
  }
  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    const local = await this.mock.getQuizQuestions(quizId);
    if (local.length > 0) return local;
    return this.remote.getQuizQuestions(quizId);
  }
  async getQuizResult(userId: string, quizId: string): Promise<QuizResult | null> {
    return (await this.mock.getQuizResult(userId, quizId)) || this.remote.getQuizResult(userId, quizId);
  }
  async saveQuizResult(result: QuizResult): Promise<QuizResult> {
    return this.mock.saveQuizResult(result);
  }
  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    const local = await this.mock.getUserQuizResults(userId);
    if (local.length > 0) return local;
    return this.remote.getUserQuizResults(userId);
  }
  async getQuizAllResults(quizId: string): Promise<QuizResult[]> {
    const local = await this.mock.getQuizAllResults(quizId);
    if (local.length > 0) return local;
    return this.remote.getQuizAllResults(quizId);
  }
  async saveQuizResults(results: QuizResult[]): Promise<QuizResult[]> {
    return this.mock.saveQuizResults(results);
  }
  async deleteQuizResult(resultId: string): Promise<void> {
    await this.mock.deleteQuizResult(resultId);
  }
  async updateQuizResult(resultId: string, data: Partial<QuizResult>): Promise<QuizResult> {
    return this.mock.updateQuizResult(resultId, data);
  }
}
