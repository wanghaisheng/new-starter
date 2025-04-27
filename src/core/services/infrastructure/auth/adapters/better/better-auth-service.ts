console.log('[DEBUG][better-auth-service] 文件被加载');

// Better 认证服务适配器，实现 IAuthAdapter，适用于自研/定制化场景
import { IAuthAdapter, AuthUser, AuthResult } from '../../types/auth-service';
import {
  authClient,
  SignInOptions,
  getCurrentUser as betterGetCurrentUser,
  refreshToken as betterRefreshToken
} from '@/core/lib/auth/betterauth/auth-client';

export class BetterAuthService implements IAuthAdapter {
  async initialize() { /* 可选：初始化 Better Auth SDK，无需重复初始化 */ }

  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    if (typeof authClient.signIn === 'function') {
      const result = await authClient.signIn({ email, password } as SignInOptions);
      return { user: result.user, token: result.token };
    }
    throw new Error('BetterAuth 未实现邮箱登录');
  }

  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    // 未实现，直接抛异常
    throw new Error('BetterAuth 未实现手机验证码登录');
  }

  async loginWithProvider(provider: string, token: string): Promise<AuthResult> {
    if (typeof authClient.socialSignIn === 'function') {
      const result = await authClient.socialSignIn({ provider, token });
      return { user: result.user, token: result.token };
    }
    throw new Error('BetterAuth 未实现第三方登录');
  }

  async logout(): Promise<void> {
    if (typeof authClient.signOut === 'function') {
      await authClient.signOut();
      return;
    }
    throw new Error('BetterAuth 未实现登出');
  }

  async getCurrentUser(): Promise<AuthUser|null> {
    return await betterGetCurrentUser();
  }

  async refreshToken(): Promise<string> {
    return await betterRefreshToken();
  }

  setConfig?(config: Record<string, any>) {/* 可选扩展 */}
}
