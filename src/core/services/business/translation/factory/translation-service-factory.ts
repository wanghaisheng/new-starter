// translation-service-factory.ts
import { MockTranslationServiceAdapter } from '../adapters/mock-translation-service-adapter';
import { RemoteTranslationServiceAdapter } from '../adapters/remote-translation-service-adapter';
import { HybridTranslationServiceAdapter } from '../adapters/hybrid-translation-service-adapter';
import { TranslationService } from '../service/translation-service';
import type { ITranslationService } from '../types/translation-service';

export type TranslationServiceType = 'mock' | 'remote' | 'hybrid';
export type TranslationServiceOptions = {
  apiBaseUrl?: string;
  [key: string]: any;
};

export class TranslationServiceFactory {
  static createService({
    type = 'remote',
    options = {}
  }: {
    type?: TranslationServiceType,
    options?: TranslationServiceOptions
  } = {}): ITranslationService {
    let finalType = type;
    let adapter;
    switch (finalType) {
      case 'mock':
        adapter = new MockTranslationServiceAdapter();
        break;
      case 'remote':
        adapter = new RemoteTranslationServiceAdapter();
        break;
      case 'hybrid':
        adapter = new HybridTranslationServiceAdapter();
        break;
      default:
        throw new Error(`Unknown translation service type: ${finalType}`);
    }
    return new TranslationService(adapter);
  }
}
