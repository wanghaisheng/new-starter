// 认证服务业务层，聚合调用适配器
import { IAuthService, AuthResult, AuthUser } from '../types/auth-service';
import { createAuthService } from '../factory/auth-service-factory';

export class AuthService {
  private adapter: IAuthService;

  constructor(type: 'mock'|'firebase'|'better' = 'mock') {
    this.adapter = createAuthService(type);
  }

  async initialize() { await this.adapter.initialize(); }
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    return this.adapter.loginWithEmail(email, password);
  }
  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    return this.adapter.loginWithPhone(phone, code);
  }
  async loginWithProvider(provider: 'google'|'apple'|'wechat', token: string): Promise<AuthResult> {
    return this.adapter.loginWithProvider(provider, token);
  }
  async logout() { return this.adapter.logout(); }
  async getCurrentUser(): Promise<AuthUser|null> { return this.adapter.getCurrentUser(); }
  async refreshToken(): Promise<string> { return this.adapter.refreshToken(); }
}
