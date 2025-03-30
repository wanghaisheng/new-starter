import { BaseEntity } from '../types/base-entity';
import { User as UserType, Location, Photo, UserPreferences } from '../types/dating';

/**
 * 用户模型类
 * 实现Dating App的用户数据模型
 */
export class User implements UserType, BaseEntity {
  id: string;
  phone?: string;
  email?: string;
  googleId?: string;
  name: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  photos: Photo[];
  bio?: string;
  interests: string[];
  location: Location;
  preferences: UserPreferences;
  isVerified: boolean;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;

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
    if (!this.createdAt) this.createdAt = new Date();
    if (!this.updatedAt) this.updatedAt = new Date();
  }

  /**
   * 转换为数据库记录
   */
  toRecord() {
    return {
      ...this,
      birthDate: this.birthDate.toISOString(),
      lastActive: this.lastActive.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      photos: JSON.stringify(this.photos),
      interests: JSON.stringify(this.interests),
      location: JSON.stringify(this.location),
      preferences: JSON.stringify(this.preferences)
    };
  }

  /**
   * 从数据库记录创建用户对象
   */
  static fromRecord(record: any): User {
    return new User({
      ...record,
      photos: typeof record.photos === 'string' ? JSON.parse(record.photos) : record.photos,
      interests: typeof record.interests === 'string' ? JSON.parse(record.interests) : record.interests,
      location: typeof record.location === 'string' ? JSON.parse(record.location) : record.location,
      preferences: typeof record.preferences === 'string' ? JSON.parse(record.preferences) : record.preferences
    });
  }
}