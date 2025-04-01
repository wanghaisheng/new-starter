import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '../interfaces';
import { Photo } from '../types';

/**
 * 照片仓储类
 * 处理用户照片相关的数据访问
 */
export class PhotoRepository extends BaseRepository<Photo> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'photos');
  }

  /**
   * 根据用户ID查找照片
   * @param userId 用户ID
   * @returns 照片列表
   */
  async findByUserId(userId: string): Promise<Photo[]> {
    return this.query({
      where: { userId }
    });
  }

  /**
   * 查找用户的主照片
   * @param userId 用户ID
   * @returns 主照片或null
   */
  async findMainPhotoByUserId(userId: string): Promise<Photo | null> {
    const photos = await this.query({
      where: { 
        userId,
        isMain: true
      },
      limit: 1
    });
    return photos[0] || null;
  }

  /**
   * 按顺序查找用户照片
   * @param userId 用户ID
   * @returns 按顺序排列的照片列表
   */
  async findByUserIdOrdered(userId: string): Promise<Photo[]> {
    return this.query({
      where: { userId },
      orderBy: {
        field: 'order',
        direction: 'asc'
      }
    });
  }
}