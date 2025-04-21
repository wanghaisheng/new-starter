// Firebase 认证服务适配器，实现 IAuthAdapter，适用于生产环境
import { IAuthAdapter, AuthUser, AuthResult } from '../../types/auth-service';
import { FirebaseAuthService } from '@/core/lib/auth/firebase/firebase-auth-service';

// 工厂/单例模式，保证全局唯一实例
const firebaseAuth = new FirebaseAuthService({
  // 这里应填你的 firebaseConfig
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
  emulatorPort: 0
});

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
  /**
   * 初始化 Firebase SDK
   */
  async initialize() { await firebaseAuth.initialize(); }

  /**
   * 使用邮箱和密码登录
   */
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    const { user, token } = await firebaseAuth.signInWithEmail(email, password);
    return { user: fixAuthUser(user), token };
  }

  /**
   * 使用手机号和验证码登录
   */
  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    throw new Error('Firebase 未实现手机验证码登录');
  }

  /**
   * 使用第三方登录（如 Google、Apple、WeChat）
   */
  async loginWithProvider(provider: 'google'|'apple'|'wechat', token: string): Promise<AuthResult> {
    if (provider === 'google') {
      const { user, token: idToken } = await firebaseAuth.signInWithGoogle();
      return { user: fixAuthUser(user), token: idToken };
    }
    throw new Error('暂未实现该第三方登录');
  }

  /**
   * 退出登录
   * TODO: 调用 firebase API
   */
  async logout(): Promise<void> { await firebaseAuth.signOut(); }

  /**
   * 获取当前登录用户
   * TODO: 调用 firebase API
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    const user = await firebaseAuth.getCurrentUser();
    return user ? fixAuthUser(user) : null;
  }

  /**
   * 刷新令牌
   * TODO: 调用 firebase API
   */
  async refreshToken(): Promise<string> {
    return firebaseAuth.refreshToken();
  }

  setConfig?(config: Record<string, any>) {/* 可选扩展 */}
}
