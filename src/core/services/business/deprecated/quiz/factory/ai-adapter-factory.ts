// AI 适配器工厂，支持插件式 provider 注册表
import type { IQuizAiAdapter } from '../types/quiz-service';
import { QuizAiAdapterRegistry } from '../registry/ai-adapter-registry';
import { DefaultAIAdapter } from '../quiz-ai-adapters/default-ai-adapter';
import { MockAIAdapter } from '../quiz-ai-adapters/mock-ai-adapter';

export type QuizAiAdapterType = 'default' | 'mock' | string;

export function createQuizAiAdapter(type: QuizAiAdapterType = 'default', apiBaseUrl?: string): IQuizAiAdapter {
  // 优先用注册表 provider，否则 fallback 到内置
  const adapter = QuizAiAdapterRegistry.getProvider(type);
  if (adapter) return adapter;
  switch(type) {
    case 'mock':
      return new MockAIAdapter();
    case 'default':
    default:
      // DefaultAIAdapter 需要 apiBaseUrl
      if (!apiBaseUrl) throw new Error('DefaultAIAdapter 需要 apiBaseUrl');
      return new DefaultAIAdapter(apiBaseUrl);
  }
}
