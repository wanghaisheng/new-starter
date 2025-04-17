import { IAuthService } from '../../types/auth-service';
import { ServiceConfig } from '../../../types/config';
import { User } from '@/core/lib/db/types/user';
import { AuthSession, PhoneAuthCredentials } from '../../types/auth-service';
import { logger } from '@/core/lib/logger';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  collection
} from 'firebase/firestore';

/**
 * Firebase 认证服务
 */
export class FirebaseAuthService implements IAuthService {
  private auth: any;
  private db: any;
  private currentUser: User | null = null;
  private initialized: boolean = false;

  constructor(private config: ServiceConfig) {
    const firebaseConfig = {
      apiKey: config.config?.apiKey,
      authDomain: config.config?.authDomain,
      projectId: config.config?.projectId,
      storageBucket: config.config?.storageBucket,
      messagingSenderId: config.config?.messagingSenderId,
      appId: config.config?.appId
    };

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    this.auth = getAuth(app);
    this.db = getFirestore(app);
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 监听认证状态变化
    onAuthStateChanged(this.auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        this.currentUser = await this.convertFirebaseUser(firebaseUser);
      } else {
        this.currentUser = null;
      }
    });

    this.initialized = true;
    logger.info('Firebase auth service initialized');
  }

  /**
   * 释放服务资源
   */
  public async dispose(): Promise<void> {
    this.currentUser = null;
    this.initialized = false;
    logger.info('Firebase auth service disposed');
  }

  /**
   * 检查服务是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取服务配置
   */
  public getConfig(): ServiceConfig {
    return this.config;
  }

  /**
   * 获取当前认证用户
   */
  public async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  /**
   * 使用邮箱和密码登录
   */
  public async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    const user = await this.convertFirebaseUser(result.user);
    const token = await result.user.getIdToken();
    return {
      user,
      token,
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  /**
   * 使用手机号和验证码登录
   */
  public async signInWithPhone(credentials: PhoneAuthCredentials): Promise<AuthSession> {
    const verifier = new RecaptchaVerifier(this.auth, 'recaptcha-container', {
      size: 'invisible'
    });
    const result = await signInWithPhoneNumber(this.auth, credentials.phoneNumber, verifier);
    const confirmationResult = await result.confirm(credentials.verificationCode);
    const user = await this.convertFirebaseUser(confirmationResult.user);
    const token = await confirmationResult.user.getIdToken();
    return {
      user,
      token,
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  /**
   * 使用第三方提供者登录
   */
  public async signInWithProvider(provider: string): Promise<AuthSession> {
    let authProvider;
    switch (provider) {
      case 'google':
        authProvider = new GoogleAuthProvider();
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const result = await signInWithPopup(this.auth, authProvider);
    const user = await this.convertFirebaseUser(result.user);
    const token = await result.user.getIdToken();
    return {
      user,
      token,
      expiresAt: new Date(Date.now() + 3600000)
    };
  }

  /**
   * 使用邮箱和密码注册
   */
  public async signUpWithEmail(email: string, password: string, name: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(result.user, { displayName: name });
    return this.convertFirebaseUser(result.user);
  }

  /**
   * 登出当前用户
   */
  public async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  /**
   * 更新用户资料
   */
  public async updateProfile(userData: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }
    return this.updateUser(this.currentUser.id, userData);
  }

  /**
   * 发送手机验证码
   */
  public async sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
    const verifier = new RecaptchaVerifier(this.auth, 'recaptcha-container', {
      size: 'invisible'
    });
    await signInWithPhoneNumber(this.auth, phoneNumber, verifier);
  }

  /**
   * 刷新认证令牌
   */
  public async refreshToken(): Promise<string> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user');
    }
    return this.auth.currentUser.getIdToken(true);
  }

  /**
   * 重置密码
   */
  public async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  /**
   * 发送邮箱验证
   */
  public async sendEmailVerification(): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user');
    }
    await sendEmailVerification(this.auth.currentUser);
  }

  /**
   * 验证邮箱
   */
  public async verifyEmail(code: string): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user');
    }
    await verifyBeforeUpdateEmail(this.auth.currentUser, this.auth.currentUser.email || '', code);
  }

  /**
   * 创建用户
   */
  public async createUser(data: Partial<User>): Promise<User> {
    const userRef = doc(this.db, 'users', data.id || '');
    await setDoc(userRef, {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return this.getUser(data.id || '') as Promise<User>;
  }

  /**
   * 获取用户
   */
  public async getUser(id: string): Promise<User | null> {
    const userRef = doc(this.db, 'users', id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return null;
    }
    return userSnap.data() as User;
  }

  /**
   * 通过邮箱获取用户
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    const usersRef = collection(this.db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return querySnapshot.docs[0].data() as User;
  }

  /**
   * 通过手机号获取用户
   */
  public async getUserByPhone(phoneNumber: string): Promise<User | null> {
    const usersRef = collection(this.db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    return querySnapshot.docs[0].data() as User;
  }

  /**
   * 更新用户
   */
  public async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const userRef = doc(this.db, 'users', id);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
    return this.getUser(id) as Promise<User>;
  }

  /**
   * 删除用户
   */
  public async deleteUser(id: string): Promise<void> {
    const userRef = doc(this.db, 'users', id);
    await deleteDoc(userRef);
  }

  /**
   * 检查用户是否已认证
   */
  public async isAuthenticated(): Promise<boolean> {
    return !!this.currentUser;
  }

  /**
   * 发送密码重置邮件
   */
  public async sendPasswordResetEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  /**
   * 转换 Firebase 用户为应用用户
   */
  private async convertFirebaseUser(firebaseUser: FirebaseUser): Promise<User> {
    const userDoc = await getDoc(doc(this.db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }

    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      phoneNumber: firebaseUser.phoneNumber || '',
      emailVerified: firebaseUser.emailVerified,
      phoneVerified: !!firebaseUser.phoneNumber,
      photoURL: firebaseUser.photoURL || '',
      birthDate: new Date(),
      gender: 'other',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    };

    await setDoc(doc(this.db, 'users', user.id), user);
    return user;
  }
} 