import { BaseRepository } from './base-repository';
import { IUserRepository } from '../types/user-repository.types';
import { User } from '@/core/lib/db/types/user.types';
import { IDataService } from '@/core/services/data/types';
import { RepositoryFactoryRegistry } from '../factory/repository-factory';
import { EntityConverter } from '@/core/lib/db/schema/entity-converter';
import { userSchema } from '@/core/lib/db/schema/definitions/user-schema';

const userConverter = new EntityConverter<User>(userSchema);

/**
 * 用户仓储实现
 * - 只负责数据访问逻辑
 * - 注册到全局工厂，解耦主注册表
 * - 推荐所有业务 hooks/service 通过 Registry 获取实例，禁止直接 Factory 直连
 */

class UserRepository extends BaseRepository<User, User> implements IUserRepository {
  constructor(dataService: IDataService<User>) {
    super(dataService as any, 'users', userConverter);
  }

  /** 通过邮箱查找用户 */
  async findByEmail(email: string): Promise<User | null> {
    const results = await this.client.query(this.table, { where: { email } });
    if (results && results.items && results.items.length > 0) {
      const user = this.converter.fromDatabase(results.items[0]);
      return user;
    }
    return null;
  }

  /** 通过手机号查找用户 */
  async findByPhone(phone: string): Promise<User | null> {
    const results = await this.client.query(this.table, { where: { phone } });
    if (results && results.items && results.items.length > 0) {
      const user = this.converter.fromDatabase(results.items[0]);
      return user;
    }
    return null;
  }

  /** 新增用户（自动做类型安全转换） */
  async create(user: User): Promise<User> {
    const dbRecord = this.converter.toDatabase(user);
    const saved = await this.client.create(this.table, dbRecord);
    return this.converter.fromDatabase(saved);
  }

  /** 根据ID查找用户（自动做类型安全转换） */
  async findById(id: string): Promise<User | null> {
    const result = await this.client.findById(this.table, id);
    return result ? this.converter.fromDatabase(result) : null;
  }

  /** 更新用户（自动做类型安全转换） */
  async update(id: string, data: Partial<User>): Promise<User | null> {
    const dbRecord = this.converter.toDatabase(data as User);
    await this.client.update(this.table, id, dbRecord);
    return this.findById(id);
  }
}

RepositoryFactoryRegistry.registerFactory('user', (options: { dataService: IDataService<User> }) => new UserRepository(options.dataService));

export { UserRepository };
