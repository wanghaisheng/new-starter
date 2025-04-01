import { BaseEntity } from './base-entity';
import { Photo } from './photo';
import { Location } from './location';

/**
 * 用户实体接口
 * 表示系统中的用户信息
 */
export interface User extends BaseEntity {
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
}

/**
 * 用户偏好设置接口
 * 定义用户的匹配偏好
 */
export interface UserPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  distance: number; // 最大距离（公里）
  gender: ('male' | 'female' | 'other')[];
  interests: string[];
  dealBreakers?: string[];
}