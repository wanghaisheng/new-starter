import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { Location } from '@/core/lib/db/types/location';
import { Photo } from '@/core/lib/db/types/photo';
import { User as UserType, UserPreferences } from '@/core/lib/db/types/user';

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
  /** 出生日期 */
  birthDate: Date;
  /** 性别 */
  gender: 'male' | 'female' | 'other';
  /** 照片列表 */
  photos: Photo[];
  /** 个人简介 */
  bio?: string;
  /** 兴趣爱好 */
  interests: string[];
  /** 位置信息 */
  location: Location;
  /** 用户偏好设置 */
  preferences: UserPreferences;
  /** 是否已验证 */
  isVerified: boolean;
  /** 最后活跃时间 */
  lastActive: Date;
  /** 用户状态 */
  status: 'active' | 'inactive' | 'suspended';
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;

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
      createdAt: record.createdAt ? new Date(record.createdAt) : undefined,
      updatedAt: record.updatedAt ? new Date(record.updatedAt) : undefined
    });
  }
}