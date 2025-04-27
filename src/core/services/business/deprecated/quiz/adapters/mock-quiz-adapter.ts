import { IQuizAdapter } from '../types/quiz-service';
import { Quiz, QuizResult, QuizQuestion } from '@/core/lib/db/types/quiz';

export class MockQuizAdapter implements IQuizAdapter {
  private quizzes: Quiz[] = [];
  private results: QuizResult[] = [];
  private questions: QuizQuestion[] = [];

  async getQuizzes(): Promise<Quiz[]> {
    return this.quizzes;
  }
  async getQuiz(quizId: string): Promise<Quiz | null> {
    return this.quizzes.find(q => q.id === quizId) || null;
  }
  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return this.questions.filter(q => q.quizId === quizId);
  }
  async getQuizResult(userId: string, quizId: string): Promise<QuizResult | null> {
    return this.results.find(r => r.userId === userId && r.quizId === quizId) || null;
  }
  async saveQuizResult(result: QuizResult): Promise<QuizResult> {
    this.results.push(result);
    return result;
  }
  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return this.results.filter(r => r.userId === userId);
  }
  async getQuizAllResults(quizId: string): Promise<QuizResult[]> {
    return this.results.filter(r => r.quizId === quizId);
  }
  async saveQuizResults(results: QuizResult[]): Promise<QuizResult[]> {
    this.results.push(...results);
    return results;
  }
  async deleteQuizResult(resultId: string): Promise<void> {
    this.results = this.results.filter(r => r.id !== resultId);
  }
  async updateQuizResult(resultId: string, data: Partial<QuizResult>): Promise<QuizResult> {
    const idx = this.results.findIndex(r => r.id === resultId);
    if (idx === -1) throw new Error('QuizResult not found');
    this.results[idx] = { ...this.results[idx], ...data };
    return this.results[idx];
  }
}
