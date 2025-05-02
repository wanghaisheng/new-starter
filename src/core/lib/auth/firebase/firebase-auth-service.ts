// Firebase Auth Service 基础实现（mock/模板）
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { AuthStrategy } from '@/core/lib/db/types/common';

export class FirebaseAuthService {
  private app: any;
  private auth: any;
  private config: any;
  private strategy: AuthStrategy = AuthStrategy.jwt;
  private dataService: any;
  private options: { [key: string]: any } = {};

  constructor(config: any) {
    this.config = config;
    if (!getApps().length) {
      this.app = initializeApp(config);
    } else {
      this.app = getApps()[0];
    }
    this.auth = getAuth(this.app);
  }

  /**
   * 配置认证服务
   */
  configure(config: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
    emulatorPort?: number;
  }) {
    this.config = {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      appId: config.appId,
      emulatorPort: config.emulatorPort || 0
    };

    // 重新初始化 Firebase 应用
    if (this.app) {
      // 清除现有应用
      const app = getApps().find(app => app.name === this.app.name);
      if (app) {
        // Firebase 应用的删除需要异步处理
        app.delete().catch(console.error);
      }

      // 重新初始化
      this.app = initializeApp(this.config);
      this.auth = getAuth(this.app);
    }
  }

  async initialize() {
    // 可选: 检查/刷新 token
    return Promise.resolve();
  }

  async signInWithEmail(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    const user = userCredential.user;
    const token = await user.getIdToken();
    return { user, token };
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const user = result.user;
    const token = await user.getIdToken();
    return { user, token };
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  async refreshToken() {
    const user = this.auth.currentUser;
    if (user) {
      return await user.getIdToken(true);
    }
    throw new Error('No current user');
  }

  async signOut() {
    if (!this.auth) throw new Error('Firebase 未初始化');
    await import('firebase/auth').then(({ signOut }) => signOut(this.auth));
  }
}
