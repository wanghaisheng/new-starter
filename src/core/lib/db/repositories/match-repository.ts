import { BaseRepository } from './base-repository';
import { Match } from '../models/match';
import { IBaseDatabaseClient } from '../interfaces';

/**
 * 匹配仓储类
 * 处理匹配相关的数据访问
 */
export class MatchRepository extends BaseRepository<Match> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'matches');
  }
  
  /**
   * 查找用户的所有匹配
   * @param userId 用户ID
   * @returns 匹配列表
   */
  async findByUserId(userId: string): Promise<Match[]> {
    return this.query({
      where: {
        $or: [
          { userId1: userId },
          { userId2: userId }
        ]
      }
    });
  }
  
  /**
   * 查找两个用户之间的匹配
   * @param userId1 用户1 ID
   * @param userId2 用户2 ID
   * @returns 匹配或null
   */
  async findBetweenUsers(userId1: string, userId2: string): Promise<Match | null> {
    const matches = await this.query({
      where: {
        $or: [
          { userId1, userId2 },
          { userId1: userId2, userId2: userId1 }
        ]
      },
      limit: 1
    });
    
    return matches.length > 0 ? matches[0] : null;
  }
  
  /**
   * 查找特定状态的匹配
   * @param status 匹配状态
   * @returns 匹配列表
   */
  async findByStatus(status: 'pending' | 'accepted' | 'rejected'): Promise<Match[]> {
    return this.query({
      where: { status }
    });
  }
}