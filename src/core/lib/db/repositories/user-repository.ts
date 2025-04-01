import { BaseRepository } from './base-repository';
import { IBaseDatabaseClient } from '../interfaces';
import { User } from '../types/user';
import { DatabaseError } from '../errors/database-error';

/**
 * 用户仓储类
 * 处理用户相关的数据访问
 * 
 * @description
 * 提供用户数据的访问和操作方法，包括查询、创建、更新和删除用户
 */
export class UserRepository extends BaseRepository<User> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'users');
  }
  
  /**
   * 根据用户名查找用户
   * @param name 用户名
   * @returns 用户列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByName(name: string): Promise<User[]> {
    try {
      return await this.query({
        where: { name }
      });
    } catch (error) {
      throw new DatabaseError(
        `查找用户名为 ${name} 的用户失败`,
        'QUERY_ERROR',
        { name, error }
      );
    }
  }
  
  /**
   * 根据兴趣查找用户
   * @param interest 兴趣标签
   * @returns 用户列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByInterest(interest: string): Promise<User[]> {
    try {
      // 使用基类query方法而不是直接client调用
      return await this.query({
        where: {
          interests: { $contains: interest }
        }
      });
    } catch (error) {
      throw new DatabaseError(
        `查找兴趣为 ${interest} 的用户失败`,
        'QUERY_ERROR',
        { interest, error }
      );
    }
  }
  
  /**
   * 查找最近活跃的用户
   * @param limit 限制数量
   * @returns 用户列表
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findRecentlyActive(limit: number = 10): Promise<User[]> {
    try {
      return await this.query({
        orderBy: { field: 'lastActive', direction: 'desc' },
        limit
      });
    } catch (error) {
      throw new DatabaseError(
        `查找最近活跃用户失败`,
        'QUERY_ERROR',
        { limit, error }
      );
    }
  }

  /**
   * 根据Google ID查找用户
   * @param googleId Google ID
   * @returns 用户或null
   * @throws {DatabaseError} 当查询失败时抛出
   */
  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      const users = await this.query({
        where: { googleId },
        limit: 1
      });
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw new DatabaseError(
        `查找Google ID为 ${googleId} 的用户失败`,
        'QUERY_ERROR',
        { googleId, error }
      );
    }
  }

  /**
   * 更新用户最后活跃时间
   * @param userId 用户ID
   * @throws {DatabaseError} 当更新失败时抛出
   */
  async updateLastActive(userId: string): Promise<void> {
    try {
      await this.update(userId, {
        lastActive: new Date()
      });
    } catch (error) {
      throw new DatabaseError(
        `更新用户 ${userId} 的最后活跃时间失败`,
        'UPDATE_ERROR',
        { userId, error }
      );
    }
  }
}