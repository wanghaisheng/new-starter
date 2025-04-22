// 全局配置类型定义
export interface GlobalConfigItem {
  key: string;
  value: any;
  description?: string;
  ext?: Record<string, any>;
}

export interface GlobalConfig {
  id: string;
  createdAt: string;
  version: string;
  items: GlobalConfigItem[];
  updatedAt: string;
  updatedBy: string;
  metadata?: Record<string, any>;
}
