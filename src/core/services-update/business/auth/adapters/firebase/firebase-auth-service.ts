// Firebase 认证服务适配器（集成 firebase/auth 实现）
import { IAuthService, AuthResult, AuthUser } from '../../types/auth-service';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  // ... 其他配置
};

function toAuthUser(user: FirebaseUser): AuthUser {
  return {
    id: user.uid,
    email: user.email || undefined,
    phone: user.phoneNumber || undefined,
    displayName: user.displayName || undefined,
    photoURL: user.photoURL || undefined,
    provider: user.providerId,
  };
}

export class FirebaseAuthService implements IAuthService {
  private auth = getAuth();
  async initialize() {
    if (!getApps().length) initializeApp(firebaseConfig);
  }
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    return {
      user: toAuthUser(cred.user),
      token: await cred.user.getIdToken(),
    };
  }
  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    // 需前端配合获取验证码并传入 code
    throw new Error('loginWithPhone 需前端配合实现');
  }
  async loginWithProvider(provider: string, token: string): Promise<AuthResult> {
    if (provider === 'google') {
      const cred = await signInWithPopup(this.auth, new GoogleAuthProvider());
      return {
        user: toAuthUser(cred.user),
        token: await cred.user.getIdToken(),
      };
    }
    throw new Error('暂未实现该第三方登录');
  }
  async logout() { await signOut(this.auth); }
  async getCurrentUser(): Promise<AuthUser|null> {
    const user = this.auth.currentUser;
    return user ? toAuthUser(user) : null;
  }
  async refreshToken(): Promise<string> {
    const user = this.auth.currentUser;
    if (user) return await user.getIdToken(true);
    throw new Error('No user');
  }
}
