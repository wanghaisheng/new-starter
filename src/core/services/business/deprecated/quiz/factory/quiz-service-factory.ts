import { IQuizAdapter, IQuizService, IQuizAIService, IQuizReportService } from '../types/quiz-service';
import { MockQuizAdapter } from '../adapters/mock-quiz-adapter';
import { RemoteQuizAdapter } from '../adapters/remote-quiz-adapter';
import { HybridQuizAdapter } from '../adapters/hybrid-quiz-adapter';
import { QuizDataService } from '../service/quiz-data-service';
import { QuizService } from '../service/quiz-service';
import { QuizAIService } from '../service/quiz-ai-service';
import { QuizReportService } from '../service/quiz-report-service';
import { createQuizAiAdapter } from './ai-adapter-factory';
import { createQuizReportAdapter } from './report-adapter-factory';

/**
 * Quiz 业务工厂，产出各类 service 实例，保持接口与实现一一对应
 * 统一 type/apiBaseUrl 可选，自动降级，适配 mock/remote/hybrid
 */
export type QuizServiceType = 'mock' | 'remote' | 'hybrid';
export type QuizServiceOptions = {
  apiBaseUrl?: string;
  [key: string]: any;
};

export class QuizServiceFactory {
  /**
   * 产出 IQuizService 实例（核心业务服务）
   */
  static createService({
    type = 'remote',
    options = {}
  }: {
    type?: QuizServiceType,
    options?: QuizServiceOptions
  } = {}): IQuizService {
    // 统一通过 type/options 创建 QuizService，内部自动注入 dataService
    return new QuizService(type, options);
  }

  /**
   * 产出 IQuizAIService 实例（AI 能力服务）
   */
  static createQuizAIService({
    type = 'remote',
    options = {}
  }: {
    type?: QuizServiceType,
    options?: QuizServiceOptions
  } = {}): IQuizAIService {
    const aiAdapter = createQuizAiAdapter(type, options.apiBaseUrl);
    return new QuizAIService(aiAdapter);
  }

  /**
   * 产出 IQuizReportService 实例（报告生成服务）
   */
  static createQuizReportService({
    type = 'remote',
    options = {}
  }: {
    type?: QuizServiceType,
    options?: QuizServiceOptions
  } = {}): IQuizReportService {
    // createQuizReportAdapter 只接受 type 参数
    const reportAdapter = createQuizReportAdapter(type);
    return new QuizReportService(reportAdapter);
  }

  // 新增：自动适配器获取（供统一注册表/工厂调用）
  static getAdapter(type: QuizServiceType = 'remote', options: QuizServiceOptions = {}): IQuizAdapter {
    const env = typeof process !== 'undefined' ? process.env.NODE_ENV : 'production';
    let finalType = type;
    if (!finalType) {
      finalType = (env === 'test' || env === 'development') ? 'mock' : 'remote';
    }
    switch (finalType) {
      case 'mock':
        return new MockQuizAdapter();
      case 'remote':
        if (!options.apiBaseUrl) throw new Error('apiBaseUrl required for remote quiz service');
        return new RemoteQuizAdapter(options.apiBaseUrl);
      case 'hybrid':
        if (!options.apiBaseUrl) throw new Error('apiBaseUrl required for hybrid quiz service');
        return new HybridQuizAdapter(options.apiBaseUrl);
      default:
        throw new Error('Unknown quiz service type: ' + finalType);
    }
  }
}
