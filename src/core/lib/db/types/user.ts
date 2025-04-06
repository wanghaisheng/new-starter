import { BaseEntity } from './base';
import { Location } from './location';
import { Photo } from './photo';
import { TestType } from './test';

/**
 * 用户实体接口
 * 表示系统中的用户信息
 * 
 * @description
 * 表示Dating App的完整用户信息，包含个人资料、照片、位置和偏好设置
 * 支持多种验证方式和状态管理
 */
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
   * 性别
   * - male: 男性
   * - female: 女性
   * - other: 其他
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
  
  /** 隐私设置 */
  privacySettings: PrivacySettings;
  
  /** 用户匹配偏好设置 */
  preferences: UserPreferences;
  
  /** 通知设置 */
  notificationSettings: NotificationSettings;

  /** 安全设置 */
  securitySettings?: SecuritySettings;
  
  /** 测试和匹配相关信息 */
  matching: {
    /** 已完成的测试类型ID列表 */
    completedTests: string[];
    
    /** 测试权重设置 */
    testWeights: {
      [K in TestType['type']]?: number;
    };
    
    /** 各类测试的最新结果 */
    testResults: {
      [K in TestType['type']]?: {
        score: number;
        details: any; // 具体类型由TestResult.details定义
        lastUpdated: string;
      };
    };
  };
  
  /** 是否已验证账号 */
  isVerified: boolean;
  
  /** 最后活跃时间 */
  lastActive: Date;
  
  /** 是否在线 */
  isOnline: boolean;
  
  /**
   * 用户状态
   * - active: 活跃状态
   * - inactive: 不活跃状态
   * - suspended: 暂停/受限状态
   */
  status: 'active' | 'inactive' | 'suspended';

  /** 认证相关字段 */
  /** 邮箱是否已验证 */
  emailVerified?: boolean;
  /** 手机号是否已验证 */
  phoneVerified?: boolean;
  /** 密码哈希 */
  passwordHash?: string;
  /** 认证提供者 */
  provider?: 'email' | 'phone' | 'google' | 'facebook' | 'apple';
  /** 显示名称 */
  displayName?: string;
  /** 头像URL */
  photoURL?: string;
  /** 手机号码 */
  phoneNumber?: string;
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
  
  /** 最大距离（公里） */
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
    /** 主题色 */
    accentColor: string;
  };
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
  
  /** 是否显示在线状态 */
  showOnlineStatus: boolean;
  
  /** 是否显示最后活跃时间 */
  showLastActive: boolean;
  
  /** 是否在发现页面显示 */
  showInDiscovery: boolean;
  
  /** 是否显示距离信息 */
  showDistance: boolean;
  
  /** 是否允许数据收集 */
  allowDataCollection: boolean;
  
  /** 是否允许个性化广告 */
  allowPersonalizedAds: boolean;

  /** 是否向匹配用户显示邮箱 */
  showEmailToMatches: boolean;

  /** 是否向匹配用户显示电话 */
  showPhoneToMatches: boolean;

  /** 是否允许分享个人资料 */
  allowProfileSharing: boolean;
}

/**
 * 安全设置接口
 */
export interface SecuritySettings {
  /** 是否启用双因素认证 */
  twoFactorEnabled: boolean;
  /** 是否启用邮件通知 */
  emailNotifications: boolean;
  /** 是否启用登录提醒 */
  loginAlerts: boolean;
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
      [K in TestType['type']]?: number;
    };
  };
  isVerified?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
}