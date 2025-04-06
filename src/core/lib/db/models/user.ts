import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { Location } from '@/core/lib/db/types/location';
import { Photo } from '@/core/lib/db/types/photo';
import { User as UserType, UserPreferences, PrivacySettings, NotificationSettings, SecuritySettings } from '@/core/lib/db/types/user';

/**
 * 用户模型类
 * 实现Dating App的用户数据模型
 * 
 * @description
 * 表示Dating App的用户信息，包含个人资料、照片、位置和偏好设置
 * 支持用户状态管理和验证状态追踪
 */
export class User implements UserType, BaseEntity {
  /** 用户唯一标识符 */
  id: string;
  /** 手机号码 */
  phone?: string;
  /** 电子邮箱 */
  email?: string;
  /** Google账号ID */
  googleId?: string;
  /** 用户名称 */
  name: string;
  /** 昵称 */
  nickname?: string;
  /** 头像 */
  avatar?: string;
  /** 出生日期 */
  birthDate: Date;
  /** 出生时辰 */
  birthTime?: string;
  /** 性别 */
  gender: 'male' | 'female' | 'other';
  /** 照片列表 */
  photos: Photo[];
  /** 个人简介 */
  bio?: string;
  /** 兴趣爱好 */
  interests: string[];
  /** 职业 */
  occupation?: string;
  /** 教育背景 */
  education?: string;
  /** 位置信息 */
  location: Location;
  /** 隐私设置 */
  privacySettings: PrivacySettings;
  /** 用户偏好设置 */
  preferences: UserPreferences;
  /** 通知设置 */
  notificationSettings: NotificationSettings;
  /** 安全设置 */
  securitySettings?: SecuritySettings;
  /** 测试和匹配相关信息 */
  matching: {
    completedTests: string[];
    testWeights: Record<string, number>;
    testResults: Record<string, {
      score: number;
      details: any;
      lastUpdated: string;
    }>;
  };
  /** 是否已验证 */
  isVerified: boolean;
  /** 最后活跃时间 */
  lastActive: Date;
  /** 是否在线 */
  isOnline: boolean;
  /** 用户状态 */
  status: 'active' | 'inactive' | 'suspended';
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
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

  /**
   * 创建用户实例
   * @param data 用户数据，可以是部分数据
   */
  constructor(data: Partial<User>) {
    Object.assign(this, data);
    
    // 确保日期字段是Date类型
    if (data.birthDate && !(data.birthDate instanceof Date)) {
      this.birthDate = new Date(data.birthDate);
    }
    
    if (data.lastActive && !(data.lastActive instanceof Date)) {
      this.lastActive = new Date(data.lastActive);
    }
    
    if (data.createdAt && !(data.createdAt instanceof Date)) {
      this.createdAt = new Date(data.createdAt);
    }
    
    if (data.updatedAt && !(data.updatedAt instanceof Date)) {
      this.updatedAt = new Date(data.updatedAt);
    }
    
    // 设置默认值
    if (!this.photos) this.photos = [];
    if (!this.interests) this.interests = [];
    if (!this.isVerified) this.isVerified = false;
    if (!this.status) this.status = 'active';
    if (!this.lastActive) this.lastActive = new Date();
    if (!this.createdAt) this.createdAt = new Date();
    if (!this.updatedAt) this.updatedAt = new Date();
    if (!this.isOnline) this.isOnline = false;
    if (!this.matching) {
      this.matching = {
        completedTests: [],
        testWeights: {},
        testResults: {}
      };
    }
    if (!this.privacySettings) {
      this.privacySettings = {
        showProfileToEveryone: true,
        showOnlineStatus: true,
        showLastActive: true,
        showInDiscovery: true,
        showDistance: true,
        allowDataCollection: true,
        allowPersonalizedAds: true,
        showEmailToMatches: false,
        showPhoneToMatches: false,
        allowProfileSharing: true
      };
    }
    if (!this.notificationSettings) {
      this.notificationSettings = {
        newMatches: true,
        matchMessages: true,
        profileViews: true,
        profileLikes: true,
        appUpdates: true,
        promotions: true
      };
    }
    if (!this.preferences) {
      this.preferences = {
        ageRange: { min: 18, max: 99 },
        distance: 50,
        gender: ['male', 'female'],
        interests: [],
        language: 'zh-CN',
        theme: {
          darkMode: false,
          accentColor: '#3B82F6'
        }
      };
    }
  }

  /**
   * 转换为数据库记录
   * @returns 适合存储的数据库记录对象
   */
  toRecord(): Record<string, any> {
    return {
      ...this,
      birthDate: this.birthDate.toISOString(),
      lastActive: this.lastActive.toISOString(),
      photos: JSON.stringify(this.photos),
      interests: JSON.stringify(this.interests),
      location: JSON.stringify(this.location),
      preferences: JSON.stringify(this.preferences),
      privacySettings: JSON.stringify(this.privacySettings),
      notificationSettings: JSON.stringify(this.notificationSettings),
      securitySettings: this.securitySettings ? JSON.stringify(this.securitySettings) : null,
      matching: JSON.stringify(this.matching),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * 从数据库记录创建用户对象
   * @param record 数据库记录
   * @returns 用户实例
   */
  static fromRecord(record: Record<string, any>): User {
    return new User({
      ...record,
      birthDate: record.birthDate ? new Date(record.birthDate) : undefined,
      lastActive: record.lastActive ? new Date(record.lastActive) : undefined,
      photos: typeof record.photos === 'string' ? JSON.parse(record.photos) : record.photos,
      interests: typeof record.interests === 'string' ? JSON.parse(record.interests) : record.interests,
      location: typeof record.location === 'string' ? JSON.parse(record.location) : record.location,
      preferences: typeof record.preferences === 'string' ? JSON.parse(record.preferences) : record.preferences,
      privacySettings: typeof record.privacySettings === 'string' ? JSON.parse(record.privacySettings) : record.privacySettings,
      notificationSettings: typeof record.notificationSettings === 'string' ? JSON.parse(record.notificationSettings) : record.notificationSettings,
      securitySettings: record.securitySettings ? (typeof record.securitySettings === 'string' ? JSON.parse(record.securitySettings) : record.securitySettings) : undefined,
      matching: typeof record.matching === 'string' ? JSON.parse(record.matching) : record.matching,
      createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
      updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined
    });
  }
}