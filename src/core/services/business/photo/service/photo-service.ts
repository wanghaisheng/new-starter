import type { IPhotoService } from '../types/photo-service';
import type { Photo } from '@/core/lib/db/types/photo.types';
import { PhotoRepository } from '@/core/lib/db/repositories/impl/photo-repository';
import { DataServiceRegistry } from '@/core/services/data/registry/data-service-registry';

/**
 * PhotoService 实现所有照片相关业务逻辑，符合 service-design-guidelines 分层要求。
 * 仅依赖 Repository，聚合、校验、扩展业务可在此实现。
 */
export class PhotoService implements IPhotoService {
  private repo: PhotoRepository;
  private dataService: any;

  /**
   * 构造函数，注入 PhotoRepository 实例
   * @param repo 照片仓储实例
   */
  constructor() {
    this.dataService = DataServiceRegistry.get('default');
    if (!this.dataService) throw new Error('[UserService] DataServiceRegistry default 实例未注册');
    this.repo = new PhotoRepository(this.dataService);
  }

  /**
   * 获取指定用户的所有照片，按顺序返回
   * @param userId 用户ID
   */
  async findByUserIdOrdered(userId: string): Promise<Photo[]> {
    if (!userId || typeof userId !== 'string') throw new Error('用户ID不能为空且必须为字符串');
    return this.repo.findByUserIdOrdered(userId);
  }

  /**
   * 更新照片描述
   * @param photoId 照片ID
   * @param caption 新描述
   */
  async updateCaption(photoId: string, caption: string): Promise<void> {
    if (!photoId || typeof photoId !== 'string') throw new Error('照片ID不能为空且必须为字符串');
    if (typeof caption !== 'string') throw new Error('caption 必须为字符串');
    await this.repo.updateCaption(photoId, caption);
  }

  /**
   * 更新照片标签
   * @param photoId 照片ID
   * @param tags 标签数组
   */
  async updateTags(photoId: string, tags: string[]): Promise<void> {
    if (!photoId || typeof photoId !== 'string') throw new Error('照片ID不能为空且必须为字符串');
    if (!Array.isArray(tags)) throw new Error('tags 必须为数组');
    await this.repo.updateTags(photoId, tags);
  }

  /**
   * 上传新照片
   * @param userId 用户ID
   * @param file 文件对象
   * @param caption 描述
   * @param tags 标签
   */
  async uploadPhoto(userId: string, file: File, caption?: string, tags?: string[]): Promise<Photo> {
    if (!userId || typeof userId !== 'string') throw new Error('用户ID不能为空且必须为字符串');
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
      const created = await (this.repo as any).create(photo);
      if (!created) throw new Error('照片创建失败');
      return created;
    } catch (err) {
      throw new Error('上传照片失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * 删除照片
   * @param photoId 照片ID
   */
  async deletePhoto(photoId: string): Promise<boolean> {
    if (!photoId || typeof photoId !== 'string') throw new Error('照片ID不能为空且必须为字符串');
    try {
      const result = await (this.repo as any).delete(photoId);
      if (typeof result !== 'boolean') throw new Error('删除照片返回值异常');
      return result;
    } catch (err) {
      throw new Error('删除照片失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  /**
   * 设置用户头像
   * @param userId 用户ID
   * @param photoId 照片ID
   */
  async setAvatar(userId: string, photoId: string): Promise<void> {
    if (!userId || typeof userId !== 'string') throw new Error('用户ID不能为空且必须为字符串');
    if (!photoId || typeof photoId !== 'string') throw new Error('照片ID不能为空且必须为字符串');
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