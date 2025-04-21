// translation-service.ts
export interface ITranslationAdapter {
  getTranslationsByKeys(keys: string[], locale?: string): Promise<{ [key: string]: string }>;
  setTranslation?(key: string, locale: string, value: string): Promise<void>;
  deleteTranslation?(key: string, locale: string): Promise<void>;
}

export interface ITranslationService {
  getTranslationsByKeys(keys: string[], locale?: string): Promise<{ [key: string]: string }>;
  setTranslation?(key: string, locale: string, value: string): Promise<void>;
  deleteTranslation?(key: string, locale: string): Promise<void>;
}
