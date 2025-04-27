// mock-translation-service-adapter.ts
import type { ITranslationAdapter } from '../types/translation-service';
import { ConfigService } from '@/core/services/infrastructure/config/service/config-service';

export class MockTranslationServiceAdapter implements ITranslationAdapter {
  async getTranslationsByKeys(keys: string[], locale?: string) {
    const config = ConfigService.getInstance();
    const mockData = config.get<{ key: string; locale: string; value: string }[]>('translationMockData') || [];
    const lang = locale || 'zh';
    const result: { [key: string]: string } = {};
    for (const key of keys) {
      const item = mockData.find(m => m.key === key && m.locale === lang);
      result[key] = item ? item.value : key;
    }
    return result;
  }
}
