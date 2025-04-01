import { BaseEntity } from './base-entity';

/**
 * 照片实体接口
 * 表示用户上传的照片信息
 */
export interface Photo extends BaseEntity {
  url: string;
  order: number;
  isMain: boolean;
  userId: string;
}