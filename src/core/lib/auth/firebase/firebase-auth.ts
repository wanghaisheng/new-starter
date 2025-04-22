import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential,
  Auth,
  connectAuthEmulator,
  setPersistence,
  inMemoryPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';

import { DatabaseLogger, getDatabaseLogger } from '@/core/lib/db/errors/database-logger';
import { BaseEntity } from '@/core/lib/db/types/base-entity';
import { FirebaseConfig } from '../db/clients/firebase/firebase-config';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phone?: string | null;
  provider?: string;
  [key: string]: any;
}

export class FirebaseAuthService {
  private auth;

  constructor(private config: FirebaseConfig) {
    this.auth = getAuth();
  }

  async initialize(): Promise<void> {
    // 初始化认证服务
  }

  async signInWithEmail(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const token = await userCredential.user.getIdToken();
      return { user: mapFirebaseUser(userCredential.user), token };
    } catch (error) {
      throw new Error('Failed to sign in with email: ' + (error?.message || error));
    }
  }

  async signInWithGoogle(): Promise<{ user: AuthUser; token: string }> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      const token = await userCredential.user.getIdToken();
      return { user: mapFirebaseUser(userCredential.user), token };
    } catch (error) {
      throw new Error('Failed to sign in with Google: ' + (error?.message || error));
    }
  }

  async signInWithPhone(phone: string, code: string, appVerifier?: RecaptchaVerifier): Promise<{ user: AuthUser; token: string }> {
    try {
      if (!appVerifier) throw new Error('需传入 appVerifier（前端生成的 RecaptchaVerifier 实例）');
      const confirmationResult = await signInWithPhoneNumber(this.auth, phone, appVerifier);
      const userCredential = await confirmationResult.confirm(code);
      const token = await userCredential.user.getIdToken();
      return { user: mapFirebaseUser(userCredential.user), token };
    } catch (error) {
      throw new Error('Failed to sign in with phone: ' + (error?.message || error));
    }
  }

  async signInWithProvider(provider: 'google'|'apple'|'wechat', token?: string): Promise<{ user: AuthUser; token: string }> {
    try {
      let userCredential: UserCredential;
      if (provider === 'google') {
        userCredential = await signInWithPopup(this.auth, new GoogleAuthProvider());
      } else if (provider === 'apple') {
        const appleProvider = new OAuthProvider('apple.com');
        userCredential = await signInWithPopup(this.auth, appleProvider);
      } else if (provider === 'wechat') {
        throw new Error('暂未实现 WeChat 登录，需集成微信 OAuth 流程');
      } else {
        throw new Error('暂不支持该第三方登录: ' + provider);
      }
      const idToken = await userCredential.user.getIdToken();
      return { user: mapFirebaseUser(userCredential.user), token: idToken };
    } catch (error) {
      throw new Error('Failed to sign in with provider: ' + provider + ' - ' + (error?.message || error));
    }
  }

  async signUp(email: string, password: string, displayName?: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      return mapFirebaseUser(userCredential.user);
    } catch (error) {
      throw new Error('Failed to sign up: ' + (error?.message || error));
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw new Error('Failed to sign out: ' + (error?.message || error));
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw new Error('Failed to reset password: ' + (error?.message || error));
    }
  }

  async updateUserProfile(displayName?: string, photoURL?: string): Promise<AuthUser> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No user is signed in');
      }
      await updateProfile(user, { displayName, photoURL });
      return mapFirebaseUser(user);
    } catch (error) {
      throw new Error('Failed to update user profile: ' + (error?.message || error));
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const user = this.auth.currentUser;
    return user ? mapFirebaseUser(user) : null;
  }

  async refreshToken(): Promise<string> {
    const user = this.auth.currentUser;
    if (user) return await user.getIdToken(true);
    throw new Error('No user');
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, (user) => {
      callback(user ? mapFirebaseUser(user) : null);
    });
  }
}

export function mapFirebaseUser(user: FirebaseUser): AuthUser {
  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    phone: user.phoneNumber,
    provider: user.providerId,
  };
}
