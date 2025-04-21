// remote-translation-service-adapter.ts
import type { ITranslationAdapter } from '../types/translation-service';
import { db } from '@/core/lib/db';

export class RemoteTranslationServiceAdapter implements ITranslationAdapter {
  async getTranslationsByKeys(keys: string[], locale?: string) {
    const lang = locale || 'zh';
    const rows = await db.translations
      .where('key').anyOf(keys)
      .and((row: any) => row.locale === lang)
      .toArray();
    const result: { [key: string]: string } = {};
    for (const key of keys) {
      const row = rows.find((r: any) => r.key === key);
      result[key] = row ? row.value : key;
    }
    return result;
  }
}
