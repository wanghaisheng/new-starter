import { User } from '@/core/lib/db/types/user.types';
import { MockRepository } from './mock-repository';

/**
 * User 实体的 Mock 仓储，继承通用 MockRepository，并实现 IUserRepository 专属方法
 */
export class UserMockRepository extends MockRepository<User> {
  /** 通过邮箱查找用户 */
  async findByEmail(email: string): Promise<User | null> {
    const all = await this.findAll();
    return all.find(u => u.email === email) || null;
  }

  /** 通过手机号查找用户 */
  async findByPhone(phone: string): Promise<User | null> {
    const all = await this.findAll();
    return all.find(u => u.phone === phone) || null;
  }
  // 可扩展更多 User 专属 mock 方法
}