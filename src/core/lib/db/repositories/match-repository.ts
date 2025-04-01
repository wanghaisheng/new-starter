import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '../interfaces';
import { Match } from '../types/match';
import { DatabaseError } from '../errors/database-error';
import { CreateMatchData } from '../types/match';

/**
 * 匹配仓储类
 * 处理用户匹配相关的数据访问
 * 
 * @description
 * 提供匹配数据的访问和操作方法，包括查询、创建、更新和删除匹配
 */
export class MatchRepository extends BaseRepository<Match> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'matches');
  }
  
  /**
   * 创建新的匹配
   * @param users 用户ID对
   * @param status 初始状态，默认为'pending'
   * @returns 创建的匹配
   * @throws {DatabaseError} 当创建失败时抛出
   */
  async createMatch(users: [string, string], status: Match['status'] = 'pending'): Promise<Match> {
    try {
      const matchData = {
        users,
        status
      };
      return await this.create(matchData);
    } catch (error) {
      throw new DatabaseError(
        '创建匹配失败',
        'CREATE_ERROR',
        { users, status, error }
      );
    }
  }
  
  /**
   * 查找用户的所有匹配
   * @param userId 用户ID
   * @returns 匹配列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByUserId(userId: string): Promise<Match[]> {
    try {
      return await this.query({
        where: {
          users: { $contains: userId }
        }
      });
    } catch (error) {
      throw new DatabaseError(
        `查找用户 ${userId} 的所有匹配失败`,
        'QUERY_ERROR',
        { userId, error }
      );
    }
  }
  
  /**
   * 查找两个用户之间的匹配
   * @param userId1 第一个用户ID
   * @param userId2 第二个用户ID
   * @returns 匹配或null
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByUsers(userId1: string, userId2: string): Promise<Match | null> {
    try {
      const matches = await this.query({
        where: {
          users: { $contains: [userId1, userId2] }
        },
        limit: 1
      });
      return matches.length > 0 ? matches[0] : null;
    } catch (error) {
      throw new DatabaseError(
        `查找用户 ${userId1} 和 ${userId2} 之间的匹配失败`,
        'QUERY_ERROR',
        { userId1, userId2, error }
      );
    }
  }
  
  /**
   * 更新匹配状态
   * @param matchId 匹配ID
   * @param status 新状态
   * @throws {DatabaseError} 当更新失败时抛出
   */
  async updateStatus(matchId: string, status: Match['status']): Promise<void> {
    try {
      await this.update(matchId, {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      throw new DatabaseError(
        `更新匹配 ${matchId} 的状态失败`,
        'UPDATE_ERROR',
        { matchId, status, error }
      );
    }
  }
}