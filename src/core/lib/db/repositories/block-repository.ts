import { IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import { Block } from '@/core/lib/db/types';

import { BaseRepository } from './base-repository';

/**
 * 拉黑仓储类
 * 处理用户拉黑相关的数据访问
 */
export class BlockRepository extends BaseRepository<Block> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'blocks');
  }

  /**
   * 根据拉黑者ID查找拉黑记录
   * @param blockerId 拉黑者ID
   * @returns 拉黑记录列表
   */
  async findByBlockerId(blockerId: string): Promise<Block[]> {
    const result = await this.query({
      where: { blockerId }
    });
    return result.data;
  }

  /**
   * 根据被拉黑者ID查找拉黑记录
   * @param blockedId 被拉黑者ID
   * @returns 拉黑记录列表
   */
  async findByBlockedId(blockedId: string): Promise<Block[]> {
    const result = await this.query({
      where: { blockedId }
    });
    return result.data;
  }

  /**
   * 检查用户是否被拉黑
   * @param blockerId 拉黑者ID
   * @param blockedId 被拉黑者ID
   * @returns 是否被拉黑
   */
  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const blocks = await this.query({
      where: {
        blockerId,
        blockedId,
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ]
      }
    });
    return blocks.data.length > 0;
  }

  /**
   * 获取有效的拉黑记录（未过期）
   * @param blockerId 拉黑者ID
   * @returns 有效的拉黑记录列表
   */
  async findActiveByBlockerId(blockerId: string): Promise<Block[]> {
    const result = await this.query({
      where: {
        blockerId,
        $or: [
          { expiresAt: { $gt: new Date() } },
          { expiresAt: null }
        ]
      }
    });
    return result.data;
  }
}