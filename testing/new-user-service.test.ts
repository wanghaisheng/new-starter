import { describe, it, beforeEach, expect, vi } from 'vitest';
import { NewUserService } from '@/core/services/business/new-user/service/new-user-service';
import { repositoryRegistry } from '@/core/lib/db/repositories/registry/repository-registry';
import type { IUserRepository } from '@/core/lib/db/repositories/types/user-repository.types';
import { MOCK_USERS } from '@/core/lib/db/types/__mocks__/mock-data';
import type { User } from '@/core/lib/db/types/user.types';

const mockUser: User = MOCK_USERS[0];

describe('NewUserService', () => {
  let service: NewUserService;
  let userRepo: IUserRepository;

  beforeEach(() => {
    userRepo = {
      findById: vi.fn().mockResolvedValue(mockUser),
      update: vi.fn().mockResolvedValue({ ...mockUser, name: 'updated' }),
      // ...可补充其它 mock 方法
    } as any;
    vi.spyOn(repositoryRegistry, 'get').mockReturnValue(userRepo);
    service = new NewUserService();
  });

  it('should get current user', async () => {
    const result = await service.getCurrentUser();
    expect(result.data).toEqual(mockUser);
    expect(result.loading).toBe(false);
    expect(result.error).toBeNull();
  });

  it('should get user by id', async () => {
    const result = await service.getUserById('u1');
    expect(userRepo.findById).toHaveBeenCalledWith('u1');
    expect(result.data).toEqual(mockUser);
  });

  it('should update user profile', async () => {
    const result = await service.updateUserProfile('u1', { name: 'updated' });
    expect(userRepo.update).toHaveBeenCalledWith('u1', { name: 'updated' });
    expect(result.data).toEqual({ ...mockUser, name: 'updated' });
  });

  it('should handle errors', async () => {
    (userRepo.findById as any).mockRejectedValueOnce(new Error('fail'));
    const result = await service.getUserById('fail');
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });
});
