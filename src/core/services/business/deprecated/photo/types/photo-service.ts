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

  // 可扩展更多业务方法，如上传、删除、设置头像等
}
