// 持久化 mock 认证服务（localStorage 版）
// 用于 mock 阶段需要登录态持久化的场景
import { IAuthAdapter, AuthUser, AuthResult } from '../../types/auth-service';

const STORAGE_KEY = 'mock_auth_user';

export class PersistentMockAuthService implements IAuthAdapter {
  private getStoredUser(): AuthUser | null {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  }
  private setStoredUser(user: AuthUser | null) {
    if (typeof window !== 'undefined') {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    }
  }

  async initialize() { /* 可选：初始化逻辑 */ }

  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    const user = { id: 'mock', email, displayName: 'Mock User' };
    this.setStoredUser(user);
    return { user, token: 'mock-token' };
  }

  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    const user = { id: 'mock', phone, displayName: 'Mock User' };
    this.setStoredUser(user);
    return { user, token: 'mock-token' };
  }

  async loginWithProvider(provider: 'google'|'apple'|'wechat', token: string): Promise<AuthResult> {
    const user = { id: 'mock', provider, displayName: 'Mock User' };
    this.setStoredUser(user);
    return { user, token: 'mock-token' };
  }

  async logout(): Promise<void> {
    this.setStoredUser(null);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.getStoredUser();
  }

  async refreshToken(): Promise<string> {
    return 'mock-token';
  }

  setConfig?(config: Record<string, any>) {/* 可选扩展 */}
}
