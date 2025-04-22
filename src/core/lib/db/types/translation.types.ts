import { BaseEntity } from './base-entity';

// 多语言翻译配置类型定义
export interface Translation extends BaseEntity {
  key: string;
  value: string;
  language: string;
  context?: string;
  tags?: string[];
  ext?: Record<string, any>;
  // 兼容 translation.ts 的字�?  locale?: string;
  type?: string;
  // 注意：updatedAt 必须�?string 以兼�?BaseEntity
  updatedAt: string;
}

export interface TranslationConfig {
  id: string;
  createdAt: string;
  version: string;
  items: Translation[];
  updatedAt: string;
  updatedBy: string;
  metadata?: Record<string, any>;
}
