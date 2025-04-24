import { BaseEntity } from './base-entity';

/**
 * 多语言翻译主类型
 */
export interface Translation extends BaseEntity {
  id: string;
  key: string;
  value: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  ext: Record<string, any>;
}

/**
 * 翻译聚合/统计类型
 */
export interface TranslationStats {
  total: number;
  language: string;
  ext: Record<string, any>;
}

/**
 * 翻译创建类型
 */
export interface TranslationCreate {
  key: string;
  value: string;
  language: string;
  ext?: Record<string, any>;
}

/**
 * 翻译更新类型
 */
export interface TranslationUpdate {
  value?: string;
  ext?: Record<string, any>;
}
