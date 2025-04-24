// translation-service.ts
import type { Translation } from '@/core/lib/db/types/translation.types';

export interface ITranslationAdapter {
  getTranslationsByKeys(keys: string[], locale?: string): Promise<{ [key: string]: Translation }>;
  setTranslation?(key: string, locale: string, value: Translation): Promise<void>;
  deleteTranslation?(key: string, locale: string): Promise<void>;
}

export interface ITranslationService {
  getTranslationsByKeys(keys: string[], locale?: string): Promise<{ [key: string]: Translation }>;
  setTranslation?(key: string, locale: string, value: Translation): Promise<void>;
  deleteTranslation?(key: string, locale: string): Promise<void>;
}
