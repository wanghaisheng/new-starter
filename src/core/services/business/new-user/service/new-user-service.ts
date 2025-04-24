import { repositoryRegistry } from '@/core/lib/db/repositories/registry/repository-registry';
import type { IUserRepository } from '@/core/lib/db/repositories/types/user-repository.types';
import type { INewUserService } from '../types/new-user-service.types';
import type { User } from '@/core/lib/db/types/user.types';
import type { AsyncState, AppError } from '@/core/lib/db/types/common';

function toAsyncState<T>(data: T, loading = false, error: AppError | null = null): AsyncState<T, AppError> {
  return { data, loading, error, empty: !data };
}

export class NewUserService implements INewUserService {
  private userRepo: IUserRepository;

  constructor() {
    this.userRepo = repositoryRegistry.get('user');
  }

  async getCurrentUser(): Promise<AsyncState<User | null, AppError>> {
    try {
      const user = await this.userRepo.findById('current');
      return toAsyncState(user);
    } catch (error) {
      return toAsyncState(null, false, error as AppError);
    }
  }

  async getUserById(id: string): Promise<AsyncState<User | null, AppError>> {
    try {
      const user = await this.userRepo.findById(id);
      return toAsyncState(user);
    } catch (error) {
      return toAsyncState(null, false, error as AppError);
    }
  }

  async updateUserProfile(id: string, updates: Partial<User>): Promise<AsyncState<User, AppError>> {
    try {
      const updated = await this.userRepo.update(id, updates);
      return toAsyncState(updated!);
    } catch (error) {
      return toAsyncState(null as any, false, error as AppError);
    }
  }

  async createUser(user: Partial<User>): Promise<AsyncState<User, AppError>> {
    try {
      const created = await this.userRepo.create(user as User);
      return toAsyncState(created);
    } catch (error) {
      return toAsyncState(null as any, false, error as AppError);
    }
  }

  async getUsers(): Promise<AsyncState<User[], AppError>> {
    try {
      const users = await this.userRepo.findAll();
      return toAsyncState(users);
    } catch (error) {
      return toAsyncState([], false, error as AppError);
    }
  }

  async deleteUser(id: string): Promise<AsyncState<boolean, AppError>> {
    try {
      const ok = await this.userRepo.delete(id);
      return toAsyncState(ok);
    } catch (error) {
      return toAsyncState(false, false, error as AppError);
    }
  }
}
