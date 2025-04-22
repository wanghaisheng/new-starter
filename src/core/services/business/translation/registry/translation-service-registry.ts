import { ITranslationService } from '../types/translation-service';
import { TranslationServiceFactory, TranslationServiceType, TranslationServiceOptions } from '../factory/translation-service-factory';

export class TranslationServiceRegistry {
  private static instance: TranslationServiceRegistry;
  private registry: Record<string, ITranslationService> = {};
  private static adapters: Partial<Record<TranslationServiceType, (options?: TranslationServiceOptions) => ITranslationService>> = {};

  static getInstance() {
    if (!this.instance) this.instance = new TranslationServiceRegistry();
    return this.instance;
  }

  getProvider(type: TranslationServiceType = 'remote', name: string = 'default', options?: TranslationServiceOptions): () => ITranslationService {
    return () => this.createService(type, name, options);
  }

  createService(type: TranslationServiceType = 'remote', name: string = 'default', options?: TranslationServiceOptions): ITranslationService {
    const key = `${type}:${name}`;
    if (this.registry[key]) return this.registry[key];
    const adapter = TranslationServiceRegistry.adapters[type];
    const service = adapter
      ? adapter(options)
      : TranslationServiceFactory.createService({ type, options });
    this.registry[key] = service;
    return service;
  }

  getService(type: TranslationServiceType, name: string = 'default'): ITranslationService | undefined {
    return this.registry[`${type}:${name}`];
  }

  static registerAdapter(type: TranslationServiceType, factory: (options?: TranslationServiceOptions) => ITranslationService): void {
    this.adapters[type] = factory;
  }
  static getAdapter(type: TranslationServiceType): ((options?: TranslationServiceOptions) => ITranslationService) | undefined {
    return this.adapters[type];
  }
  static unregisterAdapter(type: TranslationServiceType): void {
    delete this.adapters[type];
  }

  getDefaultService(options?: TranslationServiceOptions): ITranslationService {
    return (
      this.getService('remote') ||
      this.getService('hybrid') ||
      this.getService('mock') ||
      this.createService('mock', 'default', options)
    );
  }

  clear() {
    this.registry = {};
  }

  static registerAllAdapters() {
    TranslationServiceRegistry.registerAdapter('mock', (options) => TranslationServiceFactory.createService({ type: 'mock', options }));
    TranslationServiceRegistry.registerAdapter('remote', (options) => TranslationServiceFactory.createService({ type: 'remote', options }));
    TranslationServiceRegistry.registerAdapter('hybrid', (options) => TranslationServiceFactory.createService({ type: 'hybrid', options }));
  }
}
