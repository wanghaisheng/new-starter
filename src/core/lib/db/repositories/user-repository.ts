import { BaseRepository } from './base-repository';
import { User } from '../models/user';
import { IBaseDatabaseClient } from '../interfaces';

/**
 * 用户仓储类
 * 处理用户相关的数据访问
 */
export class UserRepository extends BaseRepository<User> {
  constructor(client: IBaseDatabaseClient) {
    super(client, 'users');
  }
  
  /**
   * 根据用户名查找用户
   * @param name 用户名
   * @returns 用户列表
   */
  async findByName(name: string): Promise<User[]> {
    return this.query({
      where: { name }
    });
  }
  
  /**
   * 根据兴趣查找用户
   * @param interest 兴趣标签
   * @returns 用户列表
   */
  async findByInterest(interest: string): Promise<User[]> {
    // 这里需要特殊处理，因为interests是数组
    // 使用原始查询或特定的过滤逻辑
    return this.client.query<User>(this.tableName, {
      where: {
        interests: { $contains: interest }
      }
    });
  }
  
  /**
   * 查找最近活跃的用户
   * @param limit 限制数量
   * @returns 用户列表
   */
  async findRecentlyActive(limit: number = 10): Promise<User[]> {
    return this.query({
      orderBy: '-updatedAt',
      limit
    });
  }
}