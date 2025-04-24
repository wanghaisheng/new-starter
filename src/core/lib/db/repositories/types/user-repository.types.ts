import { User } from '@/core/lib/db/types/user.types';
import { IBaseRepository } from './base-repository.types';

/**
 * 用户仓储接口，继承基础仓储并扩展用户专属方法
 */
export interface IUserRepository extends IBaseRepository<User> {
  /**
   * 通过邮箱查找用户
   * @param email 邮箱地址
   * @returns 用户实例或 null
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * 通过手机号查找用户
   * @param phone 手机号
   * @returns 用户实例或 null
   */
  findByPhone(phone: string): Promise<User | null>;

  // 可扩展更多用户专属方法
}
