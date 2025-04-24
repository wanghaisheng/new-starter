import type { Quiz, QuizQuestion, QuizResult, QuizType, QuizAnswer } from '@/core/lib/db/types/quiz.types';

// Adapter interfaces moved from separate files for unified type management
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

export interface IQuizAiAdapter {
  analyzeQuizWithAI(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[],
    model?: string,
    extraPrompt?: string
  ): Promise<AIModelResponse>;
}

export interface IQuizReportAdapter {
  generateQuizReport(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[]
  ): { score: number; tags: string[]; report: any };
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

// AI 相关接口
type AIModelRequest = {
  model: string;
  prompt: string;
  params?: Record<string, any>;
};

type AIModelResponse = {
  result: string;
  raw?: any;
};

export interface IQuizAIService {
  analyzeQuizWithAI(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[],
    model?: string,
    extraPrompt?: string
  ): Promise<AIModelResponse>;
  analyzeAndSaveQuizResult?(
    quiz: Quiz,
    quizType: QuizType,
    userId: string,
    answers: QuizAnswer[],
    saveQuizResult: (result: QuizResult) => Promise<QuizResult>,
    matchService: { onQuizResult: (userId: string, tags: string[], report: any) => Promise<void> },
    model?: string,
    extraPrompt?: string
  ): Promise<QuizResult>;
}

// 报告服务接口
type QuizReport = {
  score: number;
  tags: string[];
  report: any;
};

export interface IQuizReportService {
  generateQuizReport(
    quiz: Quiz,
    quizType: QuizType,
    answers: QuizAnswer[]
  ): QuizReport;
}

export interface QuizWithQuestions {
  quiz: Quiz | null;
  questions: QuizQuestion[];
}

export interface UserQuizDetail {
  quiz: Quiz | null;
  result: QuizResult | null;
  questions: QuizQuestion[];
}

// Service 工厂类型定义
export type QuizServiceType = 'mock' | 'remote' | 'hybrid';
export interface QuizServiceOptions {
  apiBaseUrl?: string;
}
