import type { Photo } from '@/core/lib/db/types/photo.types';

export interface IPhotoService {
  /**
   * 获取用户照片，按顺序返回
   */
  findByUserIdOrdered(userId: string): Promise<Photo[]>;

  /**
   * 更新照片标题
   */
  updateCaption(photoId: string, caption: string): Promise<void>;

  /**
   * 更新照片标签
   */
  updateTags(photoId: string, tags: string[]): Promise<void>;

  /**
   * 上传新照片
   */
  uploadPhoto(userId: string, file: File, caption?: string, tags?: string[]): Promise<Photo>;

  /**
   * 删除照片
   */
  deletePhoto(photoId: string): Promise<boolean>;

  /**
   * 设置用户头像
   */
  setAvatar(userId: string, photoId: string): Promise<void>;
}