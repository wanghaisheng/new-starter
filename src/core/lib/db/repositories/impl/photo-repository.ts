import type { Photo } from '../../types/photo.types';
import { EntityConverter } from '../../../schema/entity-converter';

export class PhotoRepository {
  private converter = new EntityConverter<Photo>();

  /**
   * 查询指定用户的所有照片，按 order 字段升序排列
   */
  async findByUserIdOrdered(userId: string): Promise<Photo[]> {
    // 假设有全局 dbClient 和 photo 表名为 'photo'
    // 这里仅为示例，实际应根据项目数据库访问方式调整
    const rows = await (globalThis as any).dbClient
      .select('*')
      .from('photo')
      .where('userId', userId)
      .orderBy('order', 'asc');
    return rows.map((row: any) => this.converter.toEntity(row));
  }

  /**
   * 更新照片描述
   */
  async updateCaption(photoId: string, caption: string): Promise<void> {
    await (globalThis as any).dbClient
      .update('photo')
      .set({ caption })
      .where('id', photoId);
  }

  /**
   * 更新照片标签
   */
  async updateTags(photoId: string, tags: string[]): Promise<void> {
    await (globalThis as any).dbClient
      .update('photo')
      .set({ tags: JSON.stringify(tags) })
      .where('id', photoId);
  }
}