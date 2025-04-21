import { UserService } from '@/core/services/business/user/service/user-service';
import { MockUserAdapter } from '@/core/services/business/user/adapters/mock-user-adapter';

describe('UserService 单元测试', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService(new MockUserAdapter());
  });

  it('createUser: 应能创建新用户', async () => {
    const user = await service.createUser({ id: 'u1', name: 'test' });
    expect(user).toBeDefined();
    expect(user.id).toBe('u1');
  });

  it('getCurrentUser: 应能获取当前用户', async () => {
    const user = await service.getCurrentUser();
    expect(user).toBeDefined();
  });

  it('updateUserProfile: 应能更新用户信息', async () => {
    const updated = await service.updateUserProfile('u1', { name: 'updated' });
    expect(updated).toBeDefined();
    expect(updated.name).toBe('updated');
  });

  it('deleteUser: 应能删除用户', async () => {
    await expect(service.deleteUser('u1')).resolves.not.toThrow();
  });

  it('异常处理: adapter 抛错时应抛出异常', async () => {
    // mock adapter 抛错
    const errorAdapter = {
      createUser: () => { throw new Error('fail'); },
      getCurrentUser: () => { throw new Error('fail'); },
      updateUserProfile: () => { throw new Error('fail'); },
      deleteUser: () => { throw new Error('fail'); },
    };
    const errorService = new UserService(errorAdapter as any);
    await expect(errorService.createUser({ id: 'u2' })).rejects.toThrow('fail');
    await expect(errorService.getCurrentUser()).rejects.toThrow('fail');
    await expect(errorService.updateUserProfile('u2', {})).rejects.toThrow('fail');
    await expect(errorService.deleteUser('u2')).rejects.toThrow('fail');
  });
});
