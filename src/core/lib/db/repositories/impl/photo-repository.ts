import { BaseRepository } from './base-repository';
import { Photo } from '../../types/photo.types';
import { IDataService } from '@/core/services/data/types';
import { RepositoryFactoryRegistry } from '../factory/repository-factory';
import { EntityConverter } from '@/core/lib/db/schema/entity-converter';
import { photoSchema } from '@/core/lib/db/schema/definitions/photo-schema';
import { SortDirection } from '@/core/lib/db/types/common';

const photoConverter = new EntityConverter<Photo>(photoSchema);

/**
 * 照片仓储实现
 * - 只负责数据访问逻辑
 * - 注册到全局工厂，解耦主注册表
 * - 推荐所有业务 hooks/service 通过 Registry 获取实例，禁止直接 Factory 直连
 */
class PhotoRepository extends BaseRepository<Photo, Photo> {
  constructor(dataService: IDataService<Photo>) {
    super(dataService as any, 'photo', photoConverter);
  }

  /** 查询指定用户的所有照片，按 order 字段升序排列 */
  async findByUserIdOrdered(userId: string): Promise<Photo[]> {
    const results = await this.client.query(this.table, { where: { userId }, 
      orderBy: { field: 'order', direction: SortDirection.DESC }

    
    });
    if (results && results.items && results.items.length > 0) {
      return results.items.map((item: any) => this.converter.fromDatabase(item));
    }
    return [];
  }

  /** 更新照片描述 */
  async updateCaption(photoId: string, caption: string): Promise<Photo | null> {
    await this.client.update(this.table, photoId, { caption });
    return this.findById(photoId);
  }

  /** 更新照片标签 */
  async updateTags(photoId: string, tags: string[]): Promise<Photo | null> {
    await this.client.update(this.table, photoId, { tags });
    return this.findById(photoId);
  }
}

RepositoryFactoryRegistry.registerFactory('photo', (options: { dataService: IDataService<Photo> }) => new PhotoRepository(options.dataService));

export { PhotoRepository };