// Mock 认证服务适配器
import { IAuthService, AuthResult, AuthUser } from '../../types/auth-service';

export class MockAuthService implements IAuthService {
  async initialize() {}
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    return { user: { id: 'mock', email }, token: 'mock-token' };
  }
  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    return { user: { id: 'mock', phone }, token: 'mock-token' };
  }
  async loginWithProvider(provider: string, token: string): Promise<AuthResult> {
    return { user: { id: 'mock', provider }, token: 'mock-token' };
  }
  async logout() {}
  async getCurrentUser(): Promise<AuthUser|null> { return { id: 'mock' }; }
  async refreshToken(): Promise<string> { return 'mock-token'; }
}
