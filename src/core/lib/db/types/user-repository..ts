import { User } from './user.types';
import { IBaseRepository } from './repository';

/**
 * 用户仓储接口，继承通用仓储接口，可扩展特有方法
 */
export interface IUserRepository extends IBaseRepository<User> {
  /** 通过邮箱查找用户 */
  findByEmail(email: string): Promise<User | null>;
  /** 通过手机号查找用户 */
  findByPhone(phone: string): Promise<User | null>;
  /** 支持更多复杂查询，可按需扩展 */
}
