// translation-service-registry.ts
import type { ITranslationService } from '../types/translation-service';
import { TranslationServiceFactory } from '../factory/translation-service-factory';

export class TranslationServiceRegistry {
  private static instance: TranslationServiceRegistry;
  private registry: Record<string, ITranslationService> = {};
  private static adapters: Record<string, () => ITranslationService> = {};

  static getInstance() {
    if (!this.instance) this.instance = new TranslationServiceRegistry();
    return this.instance;
  }

  /**
   * 注册/获取翻译服务实例
   * @param env mock/remote/hybrid
   * @param name 实例名（默认 default）
   */
  createService(env: 'mock'|'remote'|'hybrid', name: string = 'default'): ITranslationService {
    const key = `${env}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const service = TranslationServiceFactory.createService(env);
    this.registry[key] = service;
    return service;
  }

  getService(env: string, name: string = 'default'): ITranslationService | undefined {
    return this.registry[`${env}:${name}`];
  }

  clear() {
    this.registry = {};
  }

  static registerAdapter(type: string, factory: () => ITranslationService) {
    this.adapters[type] = factory;
  }
  static getAdapter(type: string): ITranslationService | undefined {
    const factory = this.adapters[type];
    return factory ? factory() : undefined;
  }

  /**
   * 获取默认实例，优先 hybrid，其次 remote，其次 mock
   */
  getDefaultService(): ITranslationService {
    return (
      this.getService('hybrid') ||
      this.getService('remote') ||
      this.getService('mock') ||
      this.createService('hybrid')
    );
  }
}
