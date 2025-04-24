import { BaseRepository } from './base-repository';
import { IUserRepository } from '../types/user-repository.types';
import { User } from '@/core/lib/db/types/user.types';
import { BaseClient } from '../../clients/base-client';
import { RepositoryFactoryRegistry } from '../factory/repository-factory';

/**
 * 用户仓储实现
 * - 只负责数据访问逻辑
 * - 注册到全局工厂，解耦主注册表
 * - 推荐所有业务 hooks/service 通过 Registry 获取实例，禁止直接 Factory 直连
 */

class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor(client: BaseClient<User>) {
    super(client, 'users');
  }

  /** 通过邮箱查找用户 */
  async findByEmail(email: string): Promise<User | null> {
    console.log('[findByEmail] where:', email);
    const results = await this.client.query(this.table, { where: { email } });
    console.log('[findByEmail] query results:', results);
    return results && Array.isArray(results.items) && results.items.length > 0 ? results.items[0] : null;
  }

  /** 通过手机号查找用户 */
  async findByPhone(phone: string): Promise<User | null> {
    const results = await this.client.query(this.table, { where: { phone } });
    if (results && Array.isArray(results.items) && results.items.length > 0) {
      return results.items[0];
    }
    return null;
  }

  async findAll(where?: Partial<Record<keyof User, string | number | boolean | (string | number | boolean)[] | { like?: string; in?: (string | number)[]; gt?: string | number; gte?: string | number; lt?: string | number; lte?: string | number; eq?: string | number }>> & Record<string, any>): Promise<User[]> {
    return (await this.client.query(this.table, { where })).items;
  }

  // 可扩展更多用户专属方法
}

// 工厂注册，支持插件式解耦
RepositoryFactoryRegistry.registerFactory('user', (options: { client: BaseClient<User> }) => new UserRepository(options.client));

export { UserRepository };
