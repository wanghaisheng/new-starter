// AI 适配器注册表，支持插件式动态注册
import type { IQuizAiAdapter } from '../types/quiz-service';

export class QuizAiAdapterRegistry {
  private static adapters: Map<string, () => IQuizAiAdapter> = new Map();

  static registerProvider(type: string, factory: () => IQuizAiAdapter) {
    this.adapters.set(type, factory);
  }
  static getProvider(type: string): IQuizAiAdapter | undefined {
    const factory = this.adapters.get(type);
    return factory ? factory() : undefined;
  }
  static unregisterProvider(type: string) {
    this.adapters.delete(type);
  }
}
