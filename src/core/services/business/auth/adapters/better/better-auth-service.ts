// Better 认证服务适配器，实现 IAuthAdapter，适用于自研/定制化场景
import { IAuthAdapter, AuthUser, AuthResult } from '../../types/auth-service';
import { authClient, SignInOptions, SignUpOptions } from '@/core/lib/auth/betterauth/auth-client';

export class BetterAuthService implements IAuthAdapter {
  async initialize() { /* 可选：初始化 Better Auth SDK，无需重复初始化 */ }

  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    const result = await authClient.signIn({ email, password } as SignInOptions);
    return {
      user: result.user,
      token: result.token,
    };
  }

  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    // 假设 authClient 支持 phone 登录，否则可补充实现
    if (typeof authClient.signInWithPhone === 'function') {
      const result = await authClient.signInWithPhone({ phone, code });
      return { user: result.user, token: result.token };
    }
    throw new Error('BetterAuth 未实现手机验证码登录');
  }

  async loginWithProvider(provider: 'google'|'apple'|'wechat', token: string): Promise<AuthResult> {
    if (typeof authClient.signInWithProvider === 'function') {
      const result = await authClient.signInWithProvider({ provider, token });
      return { user: result.user, token: result.token };
    }
    throw new Error('BetterAuth 未实现第三方登录');
  }

  async logout(): Promise<void> {
    await authClient.signOut();
  }

  async getCurrentUser(): Promise<AuthUser|null> {
    const user = await authClient.getCurrentUser?.();
    return user ?? null;
  }

  async refreshToken(): Promise<string> {
    if (typeof authClient.refreshToken === 'function') {
      const { token } = await authClient.refreshToken();
      return token;
    }
    throw new Error('BetterAuth 未实现 refreshToken');
  }

  setConfig?(config: Record<string, any>) {/* 可选扩展 */}
}
