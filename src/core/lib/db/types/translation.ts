/**
 * Translation 类型定义
 */
export interface Translation {
  id: string;
  key: string;
  locale: string;
  value: string;
  type?: string;
  updatedAt: Date;
}
