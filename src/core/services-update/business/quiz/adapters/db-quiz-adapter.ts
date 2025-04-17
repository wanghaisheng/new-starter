import { IQuizAdapter } from './quiz-adapter';
import { Quiz, QuizResult, QuizQuestion } from '@/core/lib/db/types/quiz';

/**
 * 直连数据库的 Quiz 适配器（示例，需根据项目实际数据库API实现）
 */
export class DbQuizAdapter implements IQuizAdapter {
  private db: any;
  constructor(db: any) {
    this.db = db;
  }
  async getQuizzes(): Promise<Quiz[]> {
    return this.db.query('quizzes');
  }
  async getQuiz(quizId: string): Promise<Quiz | null> {
    const res = await this.db.query('quizzes', { where: { id: quizId } });
    return res[0] || null;
  }
  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return this.db.query('quiz_questions', { where: { quizId } });
  }
  async getQuizResult(userId: string, quizId: string): Promise<QuizResult | null> {
    const res = await this.db.query('quiz_results', { where: { userId, quizId } });
    return res[0] || null;
  }
  async saveQuizResult(result: QuizResult): Promise<QuizResult> {
    await this.db.insert('quiz_results', result);
    return result;
  }
  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return this.db.query('quiz_results', { where: { userId } });
  }
  async getQuizAllResults(quizId: string): Promise<QuizResult[]> {
    return this.db.query('quiz_results', { where: { quizId } });
  }
  async saveQuizResults(results: QuizResult[]): Promise<QuizResult[]> {
    await Promise.all(results.map(r => this.db.insert('quiz_results', r)));
    return results;
  }
  async deleteQuizResult(resultId: string): Promise<void> {
    await this.db.delete('quiz_results', resultId);
  }
  async updateQuizResult(resultId: string, data: Partial<QuizResult>): Promise<QuizResult> {
    await this.db.update('quiz_results', resultId, data);
    const res = await this.db.query('quiz_results', { where: { id: resultId } });
    return res[0];
  }
}
