import { BaseRepository } from './base-repository';
import { IUserRepository } from '../types/user-repository.types';
import { User } from '@/core/lib/db/types/user.types';
import { IDataService } from '@/core/services/data/types';
import { RepositoryFactoryRegistry } from '../factory/repository-factory';
import { QueryOptions } from '@/core/lib/db/types/database';

/**
 * 用户仓储实现
 * - 只负责数据访问逻辑
 * - 注册到全局工厂，解耦主注册表
 * - 推荐所有业务 hooks/service 通过 Registry 获取实例，禁止直接 Factory 直连
 */

class UserRepository implements IUserRepository {
  constructor(private dataService: IDataService<User>) {}

  /** 通过邮箱查找用户 */
  async findByEmail(email: string): Promise<User | null> {
    console.log('[findByEmail] where:', email);
    const results = await this.dataService.query('users', { where: { email } });
    console.log('[findByEmail] query results:', results);
    return results && results.items && results.items.length > 0 ? results.items[0] : null;
  }

  /** 通过手机号查找用户 */
  async findByPhone(phone: string): Promise<User | null> {
    const results = await this.dataService.query('users', { where: { phone } });
    return results && results.items && results.items.length > 0 ? results.items[0] : null;
  }

  async findAll(where?: Partial<Record<keyof User, string | number | boolean | (string | number | boolean)[] | { like?: string; in?: (string | number)[]; gt?: string | number; gte?: string | number; lt?: string | number; lte?: string | number; eq?: string | number }>> & Record<string, any>): Promise<User[]> {
    const results = await this.dataService.query('users', { where });
    return results?.items || [];
  }

  // 实现基础CRUD方法
  async findById(id: string): Promise<User | null> {
    return this.dataService.findById('users', id);
  }

  async create(user: User): Promise<User> {
    return this.dataService.create('users', user);
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.dataService.update('users', id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.dataService.delete('users', id);
    return true;
  }

  // 可扩展更多用户专属方法
}

// 工厂注册，支持插件式解耦
RepositoryFactoryRegistry.registerFactory('user', (options: { dataService: IDataService<User> }) => new UserRepository(options.dataService));

export { UserRepository };
