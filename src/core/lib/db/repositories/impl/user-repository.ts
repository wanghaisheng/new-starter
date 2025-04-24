import { BaseRepository } from './base-repository';
import { IUserRepository } from '@/core/lib/db/repositories/types/user-repository.types';
import { User } from '@/core/lib/db/types/user.types';
import { BaseClient } from '@/core/lib/db/clients/base-client';
import { RepositoryFactoryRegistry } from '../factory/repository-factory';

/**
 * 用户仓储实现
 * - 只负责数据访问逻辑
 * - 注册到全局工厂，解耦主注册表
 * - 推荐所有业务 hooks/service 通过 Registry 获取实例，禁止直接 Factory 直连
 */
type QueryResult<T> = { items?: T[]; data?: T[] };

function hasItems<T>(obj: any): obj is { items: T[] } {
  return obj && Array.isArray(obj.items);
}
function hasData<T>(obj: any): obj is { data: T[] } {
  return obj && Array.isArray(obj.data);
}

class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor(client: BaseClient) {
    super(client, 'users');
  }

  /** 通过邮箱查找用户 */
  async findByEmail(email: string): Promise<User | null> {
    // 直接用 client.query，避免 BaseRepository.query 类型分歧
    const results = await this.client.query(this.table, { where: { email } });
    console.log('[findByEmail debug] client results:', results);
    if (results && Array.isArray(results.items) && results.items.length > 0) {
      return results.items[0];
    }
    return null;
  }

  /** 通过手机号查找用户 */
  async findByPhone(phone: string): Promise<User | null> {
    const results = await this.query({ where: { phone } }) as User[] | { items?: User[]; data?: User[] };
    if (Array.isArray(results)) return results[0] || null;
    if (hasItems<User>(results)) return results.items[0] || null;
    if (hasData<User>(results)) return results.data[0] || null;
    return null;
  }

  // 可扩展更多复杂查询
}

// 工厂注册，支持插件式解耦
RepositoryFactoryRegistry.registerFactory('user', (options: { client: BaseClient }) => new UserRepository(options.client));

export { UserRepository };
