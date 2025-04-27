// Report 适配器注册表，支持插件式动态注册
import type { IQuizReportAdapter } from '../types/quiz-service';

export class QuizReportAdapterRegistry {
  private static adapters: Map<string, () => IQuizReportAdapter> = new Map();

  static registerProvider(type: string, factory: () => IQuizReportAdapter) {
    this.adapters.set(type, factory);
  }
  static getProvider(type: string): IQuizReportAdapter | undefined {
    const factory = this.adapters.get(type);
    return factory ? factory() : undefined;
  }
  static unregisterProvider(type: string) {
    this.adapters.delete(type);
  }
}
