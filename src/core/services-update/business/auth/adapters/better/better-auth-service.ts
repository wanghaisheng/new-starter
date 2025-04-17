// Better-auth 认证服务适配器（RESTful API 真实实现示例）
import { IAuthService, AuthResult, AuthUser } from '../../types/auth-service';

const BASE_URL = 'https://your-better-auth-server.com/api';

async function post<T>(url: string, body: any): Promise<T> {
  const resp = await fetch(BASE_URL + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include', // 支持 cookie/session
  });
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

export class BetterAuthService implements IAuthService {
  async initialize() {/* 可选：初始化 SDK 或 session */}
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    const data = await post<AuthResult>('/auth/login/email', { email, password });
    return data;
  }
  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    const data = await post<AuthResult>('/auth/login/phone', { phone, code });
    return data;
  }
  async loginWithProvider(provider: string, token: string): Promise<AuthResult> {
    const data = await post<AuthResult>('/auth/login/provider', { provider, token });
    return data;
  }
  async logout() {
    await post('/auth/logout', {});
  }
  async getCurrentUser(): Promise<AuthUser|null> {
    const resp = await fetch(BASE_URL + '/auth/me', { credentials: 'include' });
    if (!resp.ok) return null;
    return await resp.json();
  }
  async refreshToken(): Promise<string> {
    const data = await post<{ token: string }>('/auth/refresh', {});
    return data.token;
  }
}
