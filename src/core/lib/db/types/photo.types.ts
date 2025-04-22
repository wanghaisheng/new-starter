// 照片相关类型定义
import { BaseEntity } from './base-entity';

/**
 * 照片实体接口
 * 表示用户上传的照片信�? * 
 * @description
 * 存储用户上传的照片数据，包括URL、顺序和是否作为主要照片
 * 用于用户资料展示和匹配推�? */
export interface Photo extends BaseEntity {
  /** 照片归属的用户ID */
  userId: string;
  
  /** 照片URL地址 */
  url: string;
  
  /** 是否为头�?*/
  isAvatar: boolean;
  
  /** 扩展信息 */
  ext?: Record<string, any>;
  
  /** 照片顺序（用于排序） */
  order: number;
  
  /** 是否为主要照片（用作头像�?*/
  isMain: boolean;
  
  /** 照片标题/描述（可选） */
  caption?: string;
  
  /** 照片标签（可选） */
  tags?: string[];
}

/**
 * 照片创建接口
 * 用于上传新照片时的数据类�? */
export interface CreatePhotoData {
  url: string;
  order?: number;
  isMain?: boolean;
  userId: string;
}

/**
 * 照片更新接口
 * 用于更新照片信息时的数据类型
 */
export interface UpdatePhotoData {
  order?: number;
  isMain?: boolean;
}
