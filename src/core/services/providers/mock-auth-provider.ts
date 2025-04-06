import { AuthProvider } from '../auth-provider-registry';
import { IAuthService } from '../auth-service';
import { MockAuthService } from './mock-auth-service';

/**
 * Mock认证提供者
 * 用于开发和测试环境
 */
export const mockAuthProvider: AuthProvider = {
  name: 'mock',
  description: 'Mock认证服务，用于开发和测试环境',
  version: '1.0.0',
  configSchema: {
    enableDelay: 'boolean',
    mockUserCount: 'number',
    defaultPassword: 'string'
  },
  createService: () => {
    return new MockAuthService({
      enableDelay: true,
      mockUserCount: 10,
      defaultPassword: 'password123'
    });
  }
}; 