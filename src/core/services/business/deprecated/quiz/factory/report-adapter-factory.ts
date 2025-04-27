// Report 适配器工厂，支持插件式 provider 注册表
import type { IQuizReportAdapter } from '../types/quiz-service';
import { QuizReportAdapterRegistry } from '../registry/report-adapter-registry';
import { DefaultReportAdapter } from '../quiz-report-adapters/default-report-adapter';
import { MockReportAdapter } from '../quiz-report-adapters/mock-report-adapter';

export type QuizReportAdapterType = 'default' | 'mock' | string;

export function createQuizReportAdapter(type: QuizReportAdapterType = 'default'): IQuizReportAdapter {
  // 优先用注册表 provider，否则 fallback 到内置
  const adapter = QuizReportAdapterRegistry.getProvider(type);
  if (adapter) return adapter;
  switch(type) {
    case 'mock':
      return new MockReportAdapter();
    case 'default':
    default:
      return new DefaultReportAdapter();
  }
}
