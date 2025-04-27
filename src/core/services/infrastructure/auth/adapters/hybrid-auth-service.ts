// Hybrid 认证服务适配器示例（聚合 mock 与 remote 行为，可扩展为品牌定制等）
import { IAuthAdapter, AuthUser, AuthResult } from '../types/auth-service';
import { MockAuthService } from './mock/mock-auth-service';
import { FirebaseAuthAdapter } from './firebase/firebase-auth-service';

export class HybridAuthService implements IAuthAdapter {
  private mock = new MockAuthService();
  private remote: FirebaseAuthAdapter;

  async initialize() {
    await this.mock.initialize();
    this.remote = new FirebaseAuthAdapter();
    await this.remote.initialize();
  }
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    // 先尝试 remote，失败 fallback 到 mock
    try {
      return await this.remote.loginWithEmail(email, password);
    } catch {
      return await this.mock.loginWithEmail(email, password);
    }
  }
  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    try {
      return await this.remote.loginWithPhone(phone, code);
    } catch {
      return await this.mock.loginWithPhone(phone, code);
    }
  }
  async loginWithProvider(provider: 'google'|'apple'|'wechat', token: string): Promise<AuthResult> {
    try {
      return await this.remote.loginWithProvider(provider, token);
    } catch {
      return await this.mock.loginWithProvider(provider, token);
    }
  }
  async logout(): Promise<void> {
    await this.remote.logout();
    await this.mock.logout();
  }
  async getCurrentUser(): Promise<AuthUser|null> {
    // 优先取 remote
    return this.remote.getCurrentUser();
  }
  async refreshToken(): Promise<string> {
    return this.remote.refreshToken();
  }
  setConfig?(config: Record<string, any>) {}
}
