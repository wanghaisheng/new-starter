import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '../interfaces';
import { Match, User } from '../types';

/**
 * 匹配仓储类
 * 处理用户匹配相关的数据访问
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
          { user1Id: userId },
          { user2Id: userId }
        ]
      }
    });
  }
  
  /**
   * 查找两个用户之间的匹配
   * @param user1Id 用户1 ID
   * @param user2Id 用户2 ID
   * @returns 匹配记录
   */
  async findByUsers(user1Id: string, user2Id: string): Promise<Match | null> {
    const matches = await this.query({
      where: {
        $or: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id }
        ]
      },
      limit: 1
    });
    return matches[0] || null;
  }
  
  /**
   * 创建新的匹配
   * @param user1Id 用户1 ID
   * @param user2Id 用户2 ID
   * @returns 创建的匹配记录
   */
  async createMatch(user1Id: string, user2Id: string): Promise<Match> {
    return this.create({
      user1Id,
      user2Id,
      isMatched: false
    } as Match);
  }
  
  /**
   * 更新匹配状态
   * @param matchId 匹配ID
   * @param isMatched 是否匹配
   */
  async updateMatchStatus(matchId: string, isMatched: boolean): Promise<void> {
    await this.update(matchId, { isMatched });
  }
}