import { UserService } from '@/core/services/business/user/service/user-service';
import { MockUserAdapter } from '@/core/services/business/user/adapters/mock-user-adapter';

describe('UserService smoke test', () => {
  it('should instantiate and call basic methods without throwing', async () => {
    const adapter = new MockUserAdapter();
    const service = new UserService(adapter);
    expect(service).toBeDefined();
    if (service.getCurrentUser) {
      const user = await service.getCurrentUser();
      expect(user === null || typeof user === 'object').toBe(true);
    }
    // 进一步 smoke 测试主要方法
    const created = await service.createUser({ name: 'test' });
    expect(created).toBeDefined();
    await service.saveCurrentUser(created);
    const fetched = await service.getCurrentUser();
    expect(fetched?.name).toBe('test');
    const updated = await service.updateUserProfile(created.id, { name: 'updated' });
    expect(updated.name).toBe('updated');
    const users = await service.getUsers();
    expect(Array.isArray(users)).toBe(true);
    await service.deleteUser(created.id);
    const afterDelete = await service.getUserById(created.id);
    expect(afterDelete).toBeNull();
  });
});
