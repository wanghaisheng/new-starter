// 礼物商城配置类型定义
export interface GiftItem {
  id: string;
  name: string;
  nameI18n?: Record<string, string>; // 多语言
  price: number;
  currency: string;
  image: string;
  category?: string;
  isActive: boolean;
  version?: string;
  region?: string;
  segment?: string;
  analyticsId?: string; // 埋点/统计ID
  permissions?: string[];
  ext?: Record<string, any>;
  unlockLevel?: number; // 新增：解锁所需会员等级
}

export interface GiftConfig {
  version: string;
  items: GiftItem[];
  updatedAt: string;
  updatedBy: string;
  metadata?: Record<string, any>;
}
