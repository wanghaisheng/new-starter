import { ITranslationService } from '../types/translation-service';
import { TranslationServiceFactory, TranslationServiceOptions } from '../factory/translation-service-factory';
import { TranslationServiceType } from '@/core/lib/db/types/common';

export type TranslationServiceTypeAlias = TranslationServiceType;

export class TranslationServiceRegistry {
  private static instance: TranslationServiceRegistry;
  private registry: Record<string, ITranslationService> = {};
  private static adapters: Partial<Record<TranslationServiceTypeAlias, (options?: TranslationServiceOptions) => ITranslationService>> = {};

  static getInstance() {
    if (!this.instance) this.instance = new TranslationServiceRegistry();
    return this.instance;
  }

  getProvider(type: TranslationServiceTypeAlias = TranslationServiceType.REMOTE, name: string = 'default', options?: TranslationServiceOptions): () => ITranslationService {
    return () => this.createService(type, name, options);
  }

  createService(type: TranslationServiceTypeAlias = TranslationServiceType.REMOTE, name: string = 'default', options?: TranslationServiceOptions): ITranslationService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = TranslationServiceRegistry.adapters[type];
    if (!adapter) throw new Error(`No adapter registered for type: ${type}`);
    const service = adapter(options);
    this.registry[key] = service;
    return service;
  }

  getService(type: TranslationServiceTypeAlias, name: string = 'default'): ITranslationService | undefined {
    return this.registry[`${type}:${name}`];
  }

  static registerAdapter(type: TranslationServiceTypeAlias, factory: (options?: TranslationServiceOptions) => ITranslationService): void {
    this.adapters[type] = factory;
  }
  static getAdapter(type: TranslationServiceTypeAlias): ((options?: TranslationServiceOptions) => ITranslationService) | undefined {
    return this.adapters[type];
  }
  static unregisterAdapter(type: TranslationServiceTypeAlias): void {
    delete this.adapters[type];
  }

  getDefaultService(options?: TranslationServiceOptions): ITranslationService {
    return (
      this.getService(TranslationServiceType.REMOTE) ||
      this.getService(TranslationServiceType.HYBRID) ||
      this.getService(TranslationServiceType.MOCK) ||
      this.createService(TranslationServiceType.MOCK, 'default', options)
    );
  }

  clear() {
    this.registry = {};
  }

  static registerAllAdapters() {
    TranslationServiceRegistry.registerAdapter(TranslationServiceType.MOCK, (options) => TranslationServiceFactory.createService({ type: TranslationServiceType.MOCK, options }));
    TranslationServiceRegistry.registerAdapter(TranslationServiceType.REMOTE, (options) => TranslationServiceFactory.createService({ type: TranslationServiceType.REMOTE, options }));
    TranslationServiceRegistry.registerAdapter(TranslationServiceType.HYBRID, (options) => TranslationServiceFactory.createService({ type: TranslationServiceType.HYBRID, options }));
  }
}
