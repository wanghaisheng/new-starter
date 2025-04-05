import { IBaseDatabaseClient } from '@/core/lib/db/interfaces';
import { MatchAction } from '@/core/lib/db/types';

import { BaseRepository } from './base-repository';

/**
 * 匹配操作仓储类
 * 处理用户匹配操作相关的数据访问
 */
export class MatchActionRepository extends BaseRepository<MatchAction> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'match_actions');
  }

  /**
   * 根据用户ID查找匹配操作
   * @param userId 用户ID
   * @returns 匹配操作列表
   */
  async findByUserId(userId: string): Promise<MatchAction[]> {
    const result = await this.query({
      where: { userId }
    });
    return result.data;
  }

  /**
   * 根据目标用户ID查找匹配操作
   * @param targetUserId 目标用户ID
   * @returns 匹配操作列表
   */
  async findByTargetUserId(targetUserId: string): Promise<MatchAction[]> {
    const result = await this.query({
      where: { targetUserId }
    });
    return result.data;
  }

  /**
   * 查找两个用户之间的匹配操作
   * @param userId 用户ID
   * @param targetUserId 目标用户ID
   * @returns 匹配操作列表
   */
  async findBetweenUsers(userId: string, targetUserId: string): Promise<MatchAction[]> {
    const result = await this.query({
      where: {
        $or: [
          { userId, targetUserId },
          { userId: targetUserId, targetUserId: userId }
        ]
      }
    });
    return result.data;
  }

  /**
   * 查找用户的特定操作
   * @param userId 用户ID
   * @param action 操作类型
   * @returns 匹配操作列表
   */
  async findByUserIdAndAction(userId: string, action: MatchAction['action']): Promise<MatchAction[]> {
    const result = await this.query({
      where: { userId, action }
    });
    return result.data;
  }
}