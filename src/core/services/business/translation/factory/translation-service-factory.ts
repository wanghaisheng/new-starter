// translation-service-factory.ts
import { MockTranslationServiceAdapter } from '../adapters/mock-translation-service-adapter';
import { RemoteTranslationServiceAdapter } from '../adapters/remote-translation-service-adapter';
import { HybridTranslationServiceAdapter } from '../adapters/hybrid-translation-service-adapter';
import { TranslationService } from '../service/translation-service';
import type { ITranslationService } from '../types/translation-service';

export class TranslationServiceFactory {
  static createService(type?: 'mock' | 'remote' | 'hybrid'): ITranslationService {
    const env = typeof process !== 'undefined' ? process.env.NODE_ENV : 'production';
    let finalType = type;
    if (!finalType) {
      finalType = (env === 'test' || env === 'development') ? 'hybrid' : 'remote';
    }
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
