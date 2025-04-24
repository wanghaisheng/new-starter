import { IUserRepository } from '../types/user-repository.types';
import { User } from '@/core/lib/db/types/user.types';
import { SQLiteClient } from '@/core/lib/db/clients/sqlite/sqlite-client';
import { BaseSQLiteRepository } from './base-sqlite-repository';

/**
 * UserRepository 的 SQLite 适配器实现
 * - 继承通用 SQLite 仓储基类，极简代码
 * - 可按需扩展 user 专属方法
 */
export class UserRepositorySQLite extends BaseSQLiteRepository<User> implements IUserRepository {
  constructor(client: SQLiteClient) {
    super(client, 'users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const results = await this.client.query(this.table, { where: { email } });
    return (results.items && results.items[0]) ? (results.items[0] as User) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const results = await this.client.query(this.table, { where: { phone } });
    return (results.items && results.items[0]) ? (results.items[0] as User) : null;
  }
}
