// translation-service.ts
import type { ITranslationService, ITranslationAdapter } from '../types/translation-service';

export class TranslationService implements ITranslationService {
  private adapter: ITranslationAdapter;

  constructor(adapter: ITranslationAdapter) {
    this.adapter = adapter;
  }

  getTranslationsByKeys(keys: string[], locale?: string) {
    return this.adapter.getTranslationsByKeys(keys, locale);
  }

  async setTranslation(key: string, locale: string, value: string): Promise<void> {
    if (!this.adapter.setTranslation) throw new Error('setTranslation not implemented in this adapter');
    await this.adapter.setTranslation(key, locale, value);
  }

  async deleteTranslation(key: string, locale: string): Promise<void> {
    if (!this.adapter.deleteTranslation) throw new Error('deleteTranslation not implemented in this adapter');
    await this.adapter.deleteTranslation(key, locale);
  }
}
