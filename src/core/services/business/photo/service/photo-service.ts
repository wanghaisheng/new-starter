import type { IPhotoService } from '../types/photo-service';
import type { Photo } from '@/core/lib/db/types/photo.types';
import { PhotoRepository } from '@/core/lib/db/repositories/photo-repository';

/**
 * PhotoService 实现所有照片相关业务逻辑，符合 service-design-guidelines 分层要求。
 * 仅依赖 Repository，聚合、校验、扩展业务可在此实现。
 */
export class PhotoService implements IPhotoService {
  constructor(private repo: PhotoRepository) {}

  async findByUserIdOrdered(userId: string): Promise<Photo[]> {
    // 可扩展权限校验、缓存、聚合等业务逻辑
    return this.repo.findByUserIdOrdered(userId);
  }

  async updateCaption(photoId: string, caption: string): Promise<void> {
    // 可扩展权限校验、日志等
    return this.repo.updateCaption(photoId, caption);
  }

  async updateTags(photoId: string, tags: string[]): Promise<void> {
    // 可扩展权限校验、标签规范等
    return this.repo.updateTags(photoId, tags);
  }
}
