import { BaseEntity } from './base-entity';
import { Photo } from './photo';
import { Location } from './location';

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
  
  /** 出生日期 */
  birthDate: Date;
  
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
  
  /** 用户位置信息 */
  location: Location;
  
  /** 用户匹配偏好设置 */
  preferences: UserPreferences;
  
  /** 是否已验证账号 */
  isVerified: boolean;
  
  /** 最后活跃时间 */
  lastActive: Date;
  
  /**
   * 用户状态
   * - active: 活跃状态
   * - inactive: 不活跃状态
   * - suspended: 暂停/受限状态
   */
  status: 'active' | 'inactive' | 'suspended';
}

/**
 * 用户偏好设置接口
 * 定义用户的匹配偏好
 * 
 * @description
 * 表示用户在匹配过程中的偏好设置，包括年龄范围、距离限制、
 * 性别偏好、兴趣偏好和排除条件
 */
export interface UserPreferences {
  /** 
   * 年龄范围偏好 
   * @property min 最小年龄
   * @property max 最大年龄
   */
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
}

/**
 * 用户创建接口
 * 用于创建新用户时的数据类型
 */
export interface CreateUserData {
  phone?: string;
  email?: string;
  googleId?: string;
  name: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  bio?: string;
  photos?: Photo[];
  interests?: string[];
  location: Location;
  preferences?: UserPreferences;
}

/**
 * 用户更新接口
 * 用于更新用户时的数据类型
 */
export interface UpdateUserData {
  name?: string;
  phone?: string;
  email?: string;
  bio?: string;
  photos?: Photo[];
  interests?: string[];
  location?: Location;
  preferences?: UserPreferences;
  isVerified?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
}