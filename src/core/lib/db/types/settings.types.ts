import { BaseEntity } from './base-entity';

/**
 * 设置主类型
 */
export interface Settings extends BaseEntity {
  id: string;
  userId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
  ext: Record<string, any>;
}

/**
 * 设置聚合/统计类型
 */
export interface SettingsStats {
  total: number;
  ext: Record<string, any>;
}

/**
 * 设置创建类型
 */
export interface SettingsCreate {
  userId: string;
  key: string;
  value: string;
  ext?: Record<string, any>;
}

/**
 * 设置更新类型
 */
export interface SettingsUpdate {
  value?: string;
  ext?: Record<string, any>;
}

/**
 * 用户设置相关类型定义
 */
export interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
  notificationsEnabled: boolean;
}