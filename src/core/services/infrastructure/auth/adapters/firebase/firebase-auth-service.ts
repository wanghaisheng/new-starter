// Firebase 认证服务适配器，实现 IAuthAdapter，适用于生产环境
import { IAuthAdapter, AuthUser, AuthResult } from '../../types/auth-service';
import { FirebaseAuthService } from '@/core/lib/auth/firebase/firebase-auth-service';

// 判断环境变量，决定是否启用 Firebase
const isMockEnv = typeof process !== 'undefined' && (
  process.env.NEXT_PUBLIC_DATABASE_ENV === 'mock' ||
  process.env.NEXT_PUBLIC_DATABASE_ENV === 'test' ||
  process.env.NODE_ENV === 'test'
);

function fixAuthUser(user: any): AuthUser {
  // mock 实现，实际应根据 user 字段映射
  return {
    id: user?.uid || '',
    email: user?.email || '',
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || '',
    phoneNumber: user?.phoneNumber || '',
    providerId: user?.providerId || '',
  };
}

export class FirebaseAuthAdapter implements IAuthAdapter {
  private firebaseAuth: FirebaseAuthService | null = null;

  constructor() {
    if (!isMockEnv) {
      this.firebaseAuth = new FirebaseAuthService({
        // 这里应填你的 firebaseConfig
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',
        emulatorPort: 0
      });
    }
  }

  /**
   * 初始化 Firebase SDK
   */
  async initialize() {
    if (isMockEnv) return;
    await this.firebaseAuth!.initialize();
  }

  /**
   * 使用邮箱和密码登录
   */
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    if (isMockEnv) throw new Error('FirebaseAuthAdapter 不可用于 mock 环境');
    const { user, token } = await this.firebaseAuth!.signInWithEmail(email, password);
    return { user: fixAuthUser(user), token };
  }

  /**
   * 使用手机号和验证码登录
   */
  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    if (isMockEnv) throw new Error('FirebaseAuthAdapter 不可用于 mock 环境');
    throw new Error('Firebase 未实现手机验证码登录');
  }

  /**
   * 使用第三方登录（如 Google、Apple、WeChat）
   */
  async loginWithProvider(provider: 'google'|'apple'|'wechat', token: string): Promise<AuthResult> {
    if (isMockEnv) throw new Error('FirebaseAuthAdapter 不可用于 mock 环境');
    if (provider === 'google') {
      const { user, token: idToken } = await this.firebaseAuth!.signInWithGoogle();
      return { user: fixAuthUser(user), token: idToken };
    }
    throw new Error('暂未实现该第三方登录');
  }

  /**
   * 退出登录
   * TODO: 调用 firebase API
   */
  async logout(): Promise<void> {
    if (isMockEnv) return;
    if (this.firebaseAuth && this.firebaseAuth.signOut) {
      await this.firebaseAuth.signOut();
    } else {
      throw new Error('firebaseAuth.signOut is not a function');
    }
  }

  /**
   * 获取当前用户
   * TODO: 调用 firebase API
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (isMockEnv) return null;
    const user = await this.firebaseAuth!.getCurrentUser();
    return user ? fixAuthUser(user) : null;
  }

  /**
   * 刷新令牌
   * TODO: 调用 firebase API
   */
  async refreshToken(): Promise<string> {
    if (isMockEnv) throw new Error('FirebaseAuthAdapter 不可用于 mock 环境');
    return this.firebaseAuth!.refreshToken();
  }

  setConfig?(config: Record<string, any>) {/* 可选扩展 */}
}
