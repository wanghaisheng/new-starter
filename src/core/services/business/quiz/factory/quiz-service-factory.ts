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
export class QuizServiceFactory {
  /**
   * 产出 IQuizService 实例（核心业务服务）
   */
  static createService(
    type: 'mock' | 'remote' | 'hybrid' = 'remote',
    apiBaseUrl?: string
  ): IQuizService {
    const env = typeof process !== 'undefined' ? process.env.NODE_ENV : 'production';
    let finalType = type;
    if (!finalType) {
      finalType = (env === 'test' || env === 'development') ? 'mock' : 'remote';
    }
    let adapter: IQuizAdapter;
    switch (finalType) {
      case 'mock':
        adapter = new MockQuizAdapter();
        break;
      case 'remote':
        if (!apiBaseUrl) throw new Error('apiBaseUrl required for remote quiz service');
        adapter = new RemoteQuizAdapter(apiBaseUrl);
        break;
      case 'hybrid':
        if (!apiBaseUrl) throw new Error('apiBaseUrl required for hybrid quiz service');
        adapter = new HybridQuizAdapter(apiBaseUrl);
        break;
      default:
        throw new Error('Unknown quiz service type: ' + finalType);
    }
    const dataService = new QuizDataService(adapter);
    return new QuizService(dataService);
  }

  /**
   * 产出 IQuizAIService 实例（AI 能力服务）
   */
  static createQuizAIService(
    type?: 'mock' | 'remote' | 'hybrid',
    apiBaseUrl?: string
  ): IQuizAIService {
    const aiAdapter = createQuizAiAdapter(type, apiBaseUrl);
    return new QuizAIService(aiAdapter);
  }

  /**
   * 产出 IQuizReportService 实例（报告生成服务）
   */
  static createQuizReportService(
    type?: 'mock' | 'remote' | 'hybrid'
  ): IQuizReportService {
    const reportAdapter = createQuizReportAdapter(type);
    return new QuizReportService(reportAdapter);
  }
}
