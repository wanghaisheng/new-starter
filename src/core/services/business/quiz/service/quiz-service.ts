// quiz 核心业务逻辑实现，配置驱动与增强器链能力
import type { IQuizAdapter, IQuizService } from '../types/quiz-types';
import type { Quiz, QuizQuestion, QuizResult } from '@/core/lib/db/types/quiz.types';

// 可选：定义增强器接口
export interface IQuizEnhancer {
  beforeSave?: (result: QuizResult) => Promise<QuizResult>;
  afterSave?: (result: QuizResult) => Promise<void>;
}

export interface QuizServiceConfig {
  quizType: string;
  features?: string[];
  [key: string]: any;
}

export class QuizService implements IQuizService {
  private adapter: IQuizAdapter;
  private enhancers: IQuizEnhancer[];
  private config: QuizServiceConfig;
  private configService: any;

  /**
   * @param configService 配置服务（决定 quiz 类型、增强特性等）
   * @param adapterMap quiz 类型与 adapter 实例映射
   * @param enhancerMap 增强器工厂表
   */
  constructor(
    configService: any,
    adapterMap: Record<string, IQuizAdapter>,
    enhancerMap: Record<string, () => IQuizEnhancer>,
  ) {
    this.configService = configService;
    const quizType = configService.get('QUIZ_TYPE') || 'default';
    const enhancerList: string[] = configService.get('QUIZ_FEATURES')?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
    this.config = { quizType, features: enhancerList };
    this.adapter = adapterMap[quizType] || adapterMap['default'];
    this.enhancers = enhancerList.map(key => enhancerMap[key]?.()).filter(Boolean);
  }

  getQuizzes(): Promise<Quiz[]> {
    return this.adapter.getQuizzes();
  }
  getQuiz(quizId: string): Promise<Quiz | null> {
    return this.adapter.getQuiz(quizId);
  }
  getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    return this.adapter.getQuizQuestions(quizId);
  }
  getQuizResult(userId: string, quizId: string): Promise<QuizResult | null> {
    return this.adapter.getQuizResult(userId, quizId);
  }
  async saveQuizResult(result: QuizResult): Promise<QuizResult> {
    let enhancedResult = result;
    for (const enhancer of this.enhancers) {
      if (enhancer.beforeSave) {
        enhancedResult = await enhancer.beforeSave(enhancedResult);
      }
    }
    const saved = await this.adapter.saveQuizResult(enhancedResult);
    for (const enhancer of this.enhancers) {
      if (enhancer.afterSave) {
        await enhancer.afterSave(saved);
      }
    }
    return saved;
  }
  getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return this.adapter.getUserQuizResults(userId);
  }
  getQuizAllResults(quizId: string): Promise<QuizResult[]> {
    return this.adapter.getQuizAllResults(quizId);
  }
  saveQuizResults(results: QuizResult[]): Promise<QuizResult[]> {
    return this.adapter.saveQuizResults(results);
  }
  deleteQuizResult(resultId: string): Promise<void> {
    return this.adapter.deleteQuizResult(resultId);
  }
  updateQuizResult(resultId: string, data: Partial<QuizResult>): Promise<QuizResult> {
    return this.adapter.updateQuizResult(resultId, data);
  }
  async getQuizWithQuestions(quizId: string) {
    const quiz = await this.getQuiz(quizId);
    const questions = await this.getQuizQuestions(quizId);
    return { quiz, questions };
  }
  async getUserQuizDetail(userId: string, quizId: string) {
    const quiz = await this.getQuiz(quizId);
    const result = await this.getQuizResult(userId, quizId);
    const questions = await this.getQuizQuestions(quizId);
    return { quiz, result, questions };
  }
}