// 用户相关类型定义
import { BaseEntity } from './base-entity';
import { Location } from './location';
import { Photo } from '.\/photo.types';
import { QuizType } from '.\/quiz.types';

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
  birthDate: Date;
  
  /** 出生时辰（用于八字） */
  birthTime?: string;
  
  /**
   * 八字命理标签与分析结果（用于智能匹配�?   */
  bazi?: Record<string, any>;
  
  /** 
   * 性别
   * - male: 男�?   * - female: 女�?   * - other: 其他
   */
  gender: 'male' | 'female' | 'other';
  
  /** 用户照片列表 */
  photos: Photo[];
  
  /** 个人简介（可选） */
  bio?: string;
  
  /** 兴趣爱好列表 */
  interests: string[];
  
  /** 职业（可选） */
  occupation?: string;
  
  /** 教育背景（可选） */
  education?: string;
  
  /** 用户位置信息 */
  location: Location;
  
  /** 偏好设置 */
  preferences: UserPreferences;
  
  /** 隐私设置 */
  privacySettings: PrivacySettings;
  
  /** 通知设置 */
  notificationSettings: NotificationSettings;

  /** 安全设置 */
  securitySettings?: SecuritySettings;
  
  /** 测试和匹配相关信�?*/
  matching: {
    /** 已完成的测试类型ID列表 */
    completedTests: string[];
    
    /** 测试权重设置 */
    testWeights: {
      [K in QuizType['type']]?: number;
    };
    
    /** 各类测试的最新结�?*/
    testResults: {
      [K in QuizType['type']]?: {
        score: number;
        details: any; // 具体类型由TestResult.details定义
        lastUpdated: string;
      };
    };
  };
  
  /** 是否已验证账�?*/
  isVerified: boolean;
  
  /** 最后活跃时�?*/
  lastActive: Date;
  
  /** 是否在线 */
  isOnline: boolean;
  
  /**
   * 用户状�?   * - active: 活跃状�?   * - inactive: 不活跃状�?   * - suspended: 暂停/受限状�?   */
  status: 'active' | 'inactive' | 'suspended';

  /** 认证相关字段 */
  /** 邮箱是否已验�?*/
  emailVerified?: boolean;
  /** 手机号是否已验证 */
  phoneVerified?: boolean;
  /** 密码哈希 */
  passwordHash?: string;
  /** 认证提供�?*/
  provider?: 'email' | 'phone' | 'google' | 'facebook' | 'apple';
  /** 显示名称 */
  displayName?: string;
  /** 头像URL */
  photoURL?: string;
  /** 手机号码 */
  phoneNumber?: string;

  /** 未读通知数量 */
  unreadNotifications?: number;

  /** 用户标签 */
  tags?: string[];

  /** 用户画像/AI报告 */
  profile?: any;

  /**
   * MBTI（十六型人格）类�?   * 例如�?INTJ"�?ENFP" �?   * 用于智能匹配、兴趣画像等业务场景
   */
  mbti?: string;
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
  gender: ('male' | 'female' | 'other')[];
  
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
}

/**
 * 通知设置接口
 */
export interface NotificationSettings {
  /** 新匹配通知 */
  newMatches: boolean;
  
  /** 匹配消息通知 */
  matchMessages: boolean;
  
  /** 个人资料浏览通知 */
  profileViews: boolean;
  
  /** 个人资料点赞通知 */
  profileLikes: boolean;
  
  /** 应用更新通知 */
  appUpdates: boolean;
  
  /** 促销活动通知 */
  promotions: boolean;
}

/**
 * 隐私设置接口
 */
export interface PrivacySettings {
  /** 是否向所有人显示个人资料 */
  showProfileToEveryone: boolean;
  
  /** 是否显示在线状�?*/
  showOnlineStatus: boolean;
  
  /** 是否显示最后活跃时�?*/
  showLastActive: boolean;
  
  /** 是否在发现页面显�?*/
  showInDiscovery: boolean;
  
  /** 是否显示距离信息 */
  showDistance: boolean;
  
  /** 是否允许数据收集 */
  allowDataCollection: boolean;
  
  /** 是否允许个性化广告 */
  allowPersonalizedAds: boolean;

  /** 是否向匹配用户显示邮�?*/
  showEmailToMatches: boolean;

  /** 是否向匹配用户显示电�?*/
  showPhoneToMatches: boolean;

  /** 是否允许分享个人资料 */
  allowProfileSharing: boolean;
}

/**
 * 安全设置接口
 */
export interface SecuritySettings {
  /** 是否启用双因素认�?*/
  twoFactorEnabled: boolean;
  /** 是否启用邮件通知 */
  emailNotifications: boolean;
  /** 是否启用登录提醒 */
  loginAlerts: boolean;
}

// --- 以下类型已独立为单文件定�?---
// Match 相关类型请见 ./match.ts
// Message 相关类型请见 ./message.ts

/**
 * 用户创建接口
 */
export interface CreateUserData {
  phone?: string;
  email?: string;
  googleId?: string;
  name: string;
  nickname?: string;
  birthDate: Date;
  birthTime?: string;
  gender: 'male' | 'female' | 'other';
  bio?: string;
  photos?: Photo[];
  interests?: string[];
  location: Location;
  privacySettings?: PrivacySettings;
  preferences?: UserPreferences;
  notificationSettings?: NotificationSettings;
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
  matching?: {
    testWeights?: {
      [K in QuizType['type']]?: number;
    };
  };
  isVerified?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
}
