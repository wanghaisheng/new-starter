import { User } from '@/core/lib/db/types/user.types';
import { IBaseRepository } from './base-repository.types';

/**
 * 用户仓储接口，继承基础仓储并扩展用户专属方法
 */
export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  // 可扩展更多用户专属方法
}
