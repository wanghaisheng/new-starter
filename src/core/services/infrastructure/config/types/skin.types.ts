// 皮肤/主题配置类型定义
export interface Skin {
  id: string;
  name: string;
  nameI18n?: Record<string, string>;
  theme: string;
  background: string;
  startAt?: string;
  endAt?: string;
  description?: string;
  version?: string;
  region?: string;
  segment?: string;
  isActive: boolean;
  analyticsId?: string;
  permissions?: string[];
  ext?: Record<string, any>;
}

export interface SkinConfig {
  version: string;
  skins: Skin[];
  updatedAt: string;
  updatedBy: string;
  metadata?: Record<string, any>;
}
