import type { IPhotoService } from '../types/photo-service';
import type { Photo } from '@/core/lib/db/types/photo.types';
import { PhotoRepository } from '@/core/lib/db/repositories/impl/photo-repository';

/**
 * PhotoService 实现所有照片相关业务逻辑，符合 service-design-guidelines 分层要求。
 * 仅依赖 Repository，聚合、校验、扩展业务可在此实现。
 */
export class PhotoService implements IPhotoService {
  constructor(private repo: PhotoRepository) {}

  async findByUserIdOrdered(userId: string): Promise<Photo[]> {
    if (!userId) throw new Error('用户ID不能为空');
    // 可扩展权限校验、缓存、聚合等业务逻辑
    return this.repo.findByUserIdOrdered(userId);
  }

  async updateCaption(photoId: string, caption: string): Promise<void> {
    if (!photoId) throw new Error('照片ID不能为空');
    if (typeof caption !== 'string') throw new Error('caption 必须为字符串');
    // 可扩展权限校验、日志等
    return this.repo.updateCaption(photoId, caption);
  }

  async updateTags(photoId: string, tags: string[]): Promise<void> {
    if (!photoId) throw new Error('照片ID不能为空');
    if (!Array.isArray(tags)) throw new Error('tags 必须为数组');
    // 可扩展权限校验、标签规范等
    return this.repo.updateTags(photoId, tags);
  }

  async uploadPhoto(userId: string, file: File, caption?: string, tags?: string[]): Promise<Photo> {
    if (!userId) throw new Error('用户ID不能为空');
    if (!file) throw new Error('文件不能为空');
    try {
      const photoUrl = await (globalThis as any).fileUploader.upload(file, userId);
      const photo: Partial<Photo> = {
        userId,
        url: photoUrl,
        caption: caption || '',
        tags: tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return (this.repo as any).create(photo);
    } catch (err) {
      throw new Error('上传照片失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  async deletePhoto(photoId: string): Promise<boolean> {
    if (!photoId) throw new Error('照片ID不能为空');
    try {
      return (this.repo as any).delete(photoId);
    } catch (err) {
      throw new Error('删除照片失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  async setAvatar(userId: string, photoId: string): Promise<void> {
    if (!userId) throw new Error('用户ID不能为空');
    if (!photoId) throw new Error('照片ID不能为空');
    try {
      await (globalThis as any).dbClient
        .update('user')
        .set({ avatarPhotoId: photoId })
        .where('id', userId);
    } catch (err) {
      throw new Error('设置头像失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
}