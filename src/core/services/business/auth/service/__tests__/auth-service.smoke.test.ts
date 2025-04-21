import { AuthService } from '@/core/services/business/auth/service/auth-service';
import { AuthServiceFactory } from '@/core/services/business/auth/factory/auth-service-factory';

describe('AuthService smoke test', () => {
  it('should instantiate and call basic methods without throwing', async () => {
    const service = new AuthService('mock');
    expect(service).toBeDefined();
    if (service.getCurrentUser) {
      const user = await service.getCurrentUser();
      expect(user === null || typeof user === 'object').toBe(true);
    }
  });
});
