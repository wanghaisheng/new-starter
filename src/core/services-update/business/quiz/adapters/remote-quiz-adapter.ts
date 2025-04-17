import { IQuizAdapter } from './quiz-adapter';
import { Quiz, QuizResult, QuizQuestion } from '@/core/lib/db/types/quiz';

export class RemoteQuizAdapter implements IQuizAdapter {
  async getQuizzes(): Promise<Quiz[]> {
    const resp = await fetch('/api/quiz');
    if (!resp.ok) throw new Error('Failed to fetch quizzes');
    return resp.json();
  }
  async getQuiz(quizId: string): Promise<Quiz | null> {
    const resp = await fetch(`/api/quiz/${quizId}`);
    if (!resp.ok) throw new Error('Failed to fetch quiz');
    return resp.json();
  }
  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    const resp = await fetch(`/api/quiz/${quizId}/questions`);
    if (!resp.ok) throw new Error('Failed to fetch quiz questions');
    return resp.json();
  }
  async getQuizResult(userId: string, quizId: string): Promise<QuizResult | null> {
    const resp = await fetch(`/api/quiz/${quizId}/result/${userId}`);
    if (!resp.ok) throw new Error('Failed to fetch quiz result');
    return resp.json();
  }
  async saveQuizResult(result: QuizResult): Promise<QuizResult> {
    const resp = await fetch(`/api/quiz/${result.quizId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    if (!resp.ok) throw new Error('Failed to save quiz result');
    return resp.json();
  }
  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    const resp = await fetch(`/api/quiz/result/user/${userId}`);
    if (!resp.ok) throw new Error('Failed to fetch user quiz results');
    return resp.json();
  }
  async getQuizAllResults(quizId: string): Promise<QuizResult[]> {
    const resp = await fetch(`/api/quiz/${quizId}/results`);
    if (!resp.ok) throw new Error('Failed to fetch quiz results');
    return resp.json();
  }
  async saveQuizResults(results: QuizResult[]): Promise<QuizResult[]> {
    const resp = await fetch(`/api/quiz/result/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results),
    });
    if (!resp.ok) throw new Error('Failed to batch save quiz results');
    return resp.json();
  }
  async deleteQuizResult(resultId: string): Promise<void> {
    const resp = await fetch(`/api/quiz/result/${resultId}`, { method: 'DELETE' });
    if (!resp.ok) throw new Error('Failed to delete quiz result');
  }
  async updateQuizResult(resultId: string, data: Partial<QuizResult>): Promise<QuizResult> {
    const resp = await fetch(`/api/quiz/result/${resultId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!resp.ok) throw new Error('Failed to update quiz result');
    return resp.json();
  }
}
