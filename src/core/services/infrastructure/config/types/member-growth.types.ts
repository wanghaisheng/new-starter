// 会员成长配置类型定义
export interface GrowthLevel {
  level: number;
  name: string;
  expRequired: number;
  privileges: string[];
  icon: string;
  color?: string;
  descriptionI18n?: Record<string, string>; // 多语言
  ext?: Record<string, any>; // 扩展字段
}

export interface MemberGrowthConfig {
  version: string;
  levels: GrowthLevel[];
  segment?: string; // 分群或灰度支持
  region?: string; // 区域定向
  updatedAt: string;
  updatedBy: string;
  permissions?: string[]; // 配置项权限
  metadata?: Record<string, any>; // 其他元数据
}
