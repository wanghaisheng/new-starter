import { IUserRepository } from '../types/user-repository.types';
import { User } from '@/core/lib/db/types/user.types';
import { IndexedDBClient } from '@/core/lib/db/clients/indexeddb/indexeddb-client';
import { BaseIndexedDBRepository } from './base-indexeddb-repository';

/**
 * UserRepository 的 IndexedDB 适配器实现（自动生成模板）
 * - 继承通用基类，极简代码
 * - 可按需扩展 user 专属方法
 */
export class UserRepositoryIndexedDB
  extends BaseIndexedDBRepository<User>
  implements IUserRepository {
  constructor(client: IndexedDBClient<User>) {
    super(client, 'users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const results = await this.client.query(this.table, { where: { email } });
    return results.items[0] || null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const results = await this.client.query(this.table, { where: { phone } });
    return results.items[0] || null;
  }
}
