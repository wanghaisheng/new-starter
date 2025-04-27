// 用户相关类型定义
import { BaseEntity } from './base-entity';
import { Location } from './location.types';
import { Photo } from './photo.types';
import { QuizType } from './quiz.types';
import { Gender, UserProvider } from './common';
import { QuizTypeKey } from './common';
import { EntityStatus } from './common';

/**
 * 用户实体接口
 * 表示系统中的用户信息
 * 
 * @description
 * 表示Dating App的完整用户信息，包含个人资料、照片、位置和偏好设置
 * 支持多种验证方式和状态管�? */
export interface User extends BaseEntity {
  /** 手机号码（可选） */
  phone?: string;
  
  /** 电子邮箱（可选） */
  email?: string;
  
  /** Google账号ID（可选，用于第三方登录） */
  googleId?: string;
  
  /** 用户名称 */
  name: string;
  
  /** 昵称 */
  nickname?: string;
  
  /** 头像 */
  avatar?: string;
  
  /** 出生日期 */
  birthDate: string;
  
  /** 出生时辰（用于八字） */
  birthTime?: string;
  
  /**
   * 八字命理标签与分析结果（用于智能匹配�?   */
  bazi?: Record<string, any>;
  
  /**
   * 性别
   */
  gender?: Gender;
  
  /**
   * 用户兴趣爱好列表
   * 对应数据库 interests 字段，JSON 存储
   */
  interests: string[];

  /**
   * 用户照片列表
   * 对应数据库 photos 字段，JSON 存储
   */
  photos: Photo[];

  /**
   * 用户位置
   * 对应数据库 location 字段，JSON 存储
   */
  location: Location;

  /**
   * 偏好设置
   * 对应数据库 preferences 字段，JSON 存储
   */
  preferences: UserPreferences;

  /**
   * 隐私设置
   * 对应数据库 privacySettings 字段，JSON 存储
   */
  privacySettings: PrivacySettings;

  /**
   * 通知设置
   * 对应数据库 notificationSettings 字段，JSON 存储
   */
  notificationSettings: NotificationSettings;

  /**
   * 安全设置
   * 对应数据库 securitySettings 字段，JSON 存储，可选
   */
  securitySettings?: SecuritySettings;

  /**
   * 用户状态
   */
  status: EntityStatus;

  /**
   * 邮箱是否已验证
   */
  emailVerified?: boolean;

  /**
   * 手机号是否已验证
   */
  phoneVerified?: boolean;

  /**
   * 密码哈希
   */
  passwordHash?: string;

  /**
   * 认证提供方
   */
  provider?: UserProvider;

  /**
   * 显示名称
   */
  displayName?: string;

  /**
   * 头像URL
   */
  photoURL?: string;

  /**
   * 手机号码
   */
  phoneNumber?: string;

  /**
   * 未读通知数量
   */
  unreadNotifications?: number;

  /**
   * 用户标签
   */
  tags?: string[];

  /**
   * 用户画像/AI报告
   */
  profile?: any;

  /**
   * MBTI（十六型人格）类型
   */
  mbti?: string;

  /**
   * 扩展字段
   */
  ext?: Record<string, any>;

  /** 是否已验证账�?*/
  isVerified: boolean;
  
  /** 最后活跃时�?*/
  lastActive: Date;
  
  /** 是否在线 */
  isOnline: boolean;

}

/**
 * 用户偏好设置接口
 */
export interface UserPreferences {
  /** 年龄范围偏好 */
  ageRange: {
    min: number;
    max: number;
  };
  
  /** 最大距离（公里�?*/
  distance: number;
  
  /** 性别偏好 */
  gender: (Gender)[];
  
  /** 感兴趣的话题/标签 */
  interests: string[];
  
  /** 排除条件（可选） */
  dealBreakers?: string[];

  /** 界面语言偏好 */
  language?: string;

  /** 主题设置 */
  theme?: {
    /** 是否启用深色模式 */
    darkMode: boolean;
    /** 主题�?*/
    accentColor: string;
  };

  // 兼容旧字�?  darkMode?: boolean;
  accentColor?: string;

  /** 扩展字段 */
  ext?: Record<string, any>;
}

// 用户通知设置
export interface NotificationSettings {
  newMatches: boolean;
  matchMessages: boolean;
  profileViews: boolean;
  profileLikes: boolean;
  appUpdates: boolean;
  promotions: boolean;
  // 可扩展字段
  [key: string]: any;
}

// 用户隐私设置
export interface PrivacySettings {
  showProfileToEveryone: boolean;
  showOnlineStatus: boolean;
  showLastActive: boolean;
  showInDiscovery: boolean;
  showDistance: boolean;
  allowDataCollection: boolean;
  allowPersonalizedAds: boolean;
  showEmailToMatches: boolean;
  showPhoneToMatches: boolean;
  allowProfileSharing: boolean;
  // 可扩展字段
  [key: string]: any;
}

// 用户安全设置
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  loginAlerts: boolean;
  // 可扩展字段
  [key: string]: any;
}

/**
 * 用户创建类型
 */
export interface UserCreate {
  name: string;
  email: string;
  phone?: string;
  birthDate: string;
  ext?: Record<string, any>;
}

/**
 * 用户更新类型
 */
export interface UserUpdate {
  name?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  ext?: Record<string, any>;
}

/**
 * 用户创建接口
 */
export interface CreateUserData {
  phone?: string;
  email?: string;
  googleId?: string;
  name: string;
  nickname?: string;
  birthDate: string;
  birthTime?: string;
  gender: Gender;
  bio?: string;
  photos?: Photo[];
  interests?: string[];
  location: Location;
  privacySettings?: PrivacySettings;
  preferences?: UserPreferences;
  notificationSettings?: NotificationSettings;

  /** 扩展字段 */
  ext?: Record<string, any>;
}

/**
 * 用户更新接口
 */
export interface UpdateUserData {
  name?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  bio?: string;
  photos?: Photo[];
  interests?: string[];
  location?: Location;
  privacySettings?: PrivacySettings;
  preferences?: UserPreferences;
  notificationSettings?: NotificationSettings;
  isVerified?: boolean;
  status?: EntityStatus;

  /** 扩展字段 */
  ext?: Record<string, any>;
}

/**
 * 用户聚合统计类型
 * 用于报表、分析等场景
 */
export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  ext: Record<string, any>;
}

// --- 以下类型已独立为单文件定�?---
// Match 相关类型请见 ./match.ts
// Message 相关类型请见 ./message.ts
