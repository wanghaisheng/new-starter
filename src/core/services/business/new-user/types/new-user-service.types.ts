import type { User } from '@/core/lib/db/types/user.types';
import type { AsyncState, AppError } from '@/core/lib/db/types/common';

export interface INewUserService {
  getCurrentUser(): Promise<AsyncState<User | null, AppError>>;
  getUserById(id: string): Promise<AsyncState<User | null, AppError>>;
  updateUserProfile(id: string, updates: Partial<User>): Promise<AsyncState<User, AppError>>;
  createUser(user: Partial<User>): Promise<AsyncState<User, AppError>>;
  getUsers(): Promise<AsyncState<User[], AppError>>;
  deleteUser(id: string): Promise<AsyncState<boolean, AppError>>;
  // 可扩展更多业务方法...
}
