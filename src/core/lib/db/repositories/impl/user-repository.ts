import { BaseRepository } from './base-repository';
import { IUserRepository } from '../types/user-repository.types';
import { User } from '@/core/lib/db/types/user.types';
import { IDataService } from '@/core/services/data/types';
import { RepositoryFactoryRegistry } from '../factory/repository-factory';

/**
 * 用户仓储实现
 * - 只负责数据访问逻辑
 * - 注册到全局工厂，解耦主注册表
 * - 推荐所有业务 hooks/service 通过 Registry 获取实例，禁止直接 Factory 直连
 */

class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor(dataService: IDataService<User>) {
    super(dataService as any, 'users');
  }

  /** 通过邮箱查找用户 */
  async findByEmail(email: string): Promise<User | null> {
    const results = await this.client.query(this.table, { where: { email } });
    return results && results.items && results.items.length > 0 ? results.items[0] : null;
  }

  /** 通过手机号查找用户 */
  async findByPhone(phone: string): Promise<User | null> {
    const results = await this.client.query(this.table, { where: { phone } });
    return results && results.items && results.items.length > 0 ? results.items[0] : null;
  }
}

// 工厂注册，支持插件式解耦
RepositoryFactoryRegistry.registerFactory('user', (options: { dataService: IDataService<User> }) => new UserRepository(options.dataService));

export { UserRepository };
