import { AuthProvider, AuthError, PhoneAuthCredentials, SocialAuthCredentials, AuthProviderType } from '@/core/services/auth/auth-types';
import { User } from '@/core/lib/db/types/user';
import { logger } from '@/core/lib/logger';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  sendEmailVerification,
  EmailAuthProvider,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup
} from 'firebase/auth';

// https://firebase.google.cn/docs/auth/web/start?hl=zh-cn
/**
 * Firebase 认证提供者
 */
export class FirebaseAuthProvider implements AuthProvider {
  private static instance: FirebaseAuthProvider;
  private auth: any;
  private currentUser: User | null = null;
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private users: Map<string, User> = new Map();
  private verificationCodes: Map<string, string> = new Map();

  private constructor() {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    const app = initializeApp(firebaseConfig);
    this.auth = getAuth(app);

    // 监听认证状态变化
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this.currentUser = await this.convertFirebaseUser(user);
      } else {
        this.currentUser = null;
      }
    });

    // 初始化一些测试用户
    this.users.set('test@example.com', {
      id: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      phoneVerified: false,
      birthDate: new Date('1990-01-01'),
      gender: 'male',
      photos: [],
      interests: [],
      location: { latitude: 0, longitude: 0, city: 'Unknown', country: 'Unknown' },
      privacySettings: { 
        showProfileToEveryone: true, 
        showOnlineStatus: true, 
        showLastActive: true,
        showInDiscovery: true,
        showDistance: true,
        allowDataCollection: true,
        allowPersonalizedAds: true,
        showEmailToMatches: false,
        showPhoneToMatches: false,
        allowProfileSharing: true
      },
      preferences: { 
        ageRange: { min: 18, max: 50 }, 
        distance: 50, 
        gender: ['female'],
        interests: []
      },
      notificationSettings: { 
        newMatches: true, 
        matchMessages: true, 
        profileViews: true, 
        profileLikes: true, 
        appUpdates: true, 
        promotions: true 
      },
      matching: { completedTests: [], testWeights: {}, testResults: {} },
      isVerified: true,
      lastActive: new Date(),
      isOnline: true,
      status: 'active',
      provider: 'email',
      displayName: 'Test User',
      photoURL: undefined,
      phoneNumber: undefined
    });
  }

  static getInstance(): FirebaseAuthProvider {
    if (!FirebaseAuthProvider.instance) {
      FirebaseAuthProvider.instance = new FirebaseAuthProvider();
    }
    return FirebaseAuthProvider.instance;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('初始化Firebase认证');
      // Firebase初始化在构造函数中完成
    } catch (error) {
      logger.error('初始化Firebase认证失败', { error });
      throw new AuthError('初始化Firebase认证失败', 'INIT_ERROR');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    const user = this.users.get(email);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 模拟密码验证
    if (password !== 'password') {
      throw new Error('密码错误');
    }
    
    this.currentUser = user;
    return user;
  }

  async signInWithPhone(credentials: PhoneAuthCredentials): Promise<User> {
    const { phoneNumber, verificationCode } = credentials;
    
    // 验证验证码
    const storedCode = this.verificationCodes.get(phoneNumber);
    if (!storedCode || storedCode !== verificationCode) {
      throw new Error('验证码错误或已过期');
    }
    
    // 查找或创建用户
    let user = Array.from(this.users.values()).find(u => u.phoneNumber === phoneNumber);
    
    if (!user) {
      // 创建新用户
      user = {
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Phone User',
        email: undefined,
        emailVerified: false,
        phoneVerified: true,
        birthDate: new Date(),
        gender: 'male',
        photos: [],
        interests: [],
        location: { latitude: 0, longitude: 0, city: 'Unknown', country: 'Unknown' },
        privacySettings: { 
          showProfileToEveryone: true, 
          showOnlineStatus: true, 
          showLastActive: true,
          showInDiscovery: true,
          showDistance: true,
          allowDataCollection: true,
          allowPersonalizedAds: true,
          showEmailToMatches: false,
          showPhoneToMatches: false,
          allowProfileSharing: true
        },
        preferences: { 
          ageRange: { min: 18, max: 50 }, 
          distance: 50, 
          gender: ['female'],
          interests: []
        },
        notificationSettings: { 
          newMatches: true, 
          matchMessages: true, 
          profileViews: true, 
          profileLikes: true, 
          appUpdates: true, 
          promotions: true 
        },
        matching: { completedTests: [], testWeights: {}, testResults: {} },
        isVerified: true,
        lastActive: new Date(),
        isOnline: true,
        status: 'active',
        provider: 'phone',
        displayName: undefined,
        photoURL: undefined,
        phoneNumber
      };
      this.users.set(phoneNumber, user);
    }
    
    this.currentUser = user;
    return user;
  }

  async sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
    // 生成随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCodes.set(phoneNumber, code);
    
    // 在实际应用中，这里会发送短信
    console.log(`向 ${phoneNumber} 发送验证码: ${code}`);
  }

  async signInWithSocial(credentials: SocialAuthCredentials): Promise<User> {
    try {
      logger.info('Firebase社交账号登录', { provider: credentials.provider });
      let authProvider;
      
      switch (credentials.provider) {
        case 'google':
          authProvider = GoogleAuthProvider.credential(credentials.token);
          break;
        case 'facebook':
          authProvider = FacebookAuthProvider.credential(credentials.token);
          break;
        case 'apple':
          const appleProvider = new OAuthProvider('apple.com');
          authProvider = appleProvider.credential({
            idToken: credentials.token,
            rawNonce: undefined
          });
          break;
        default:
          throw new AuthError('不支持的社交登录提供商', 'UNSUPPORTED_PROVIDER');
      }
      
      const userCredential = await signInWithCredential(this.auth, authProvider);
      return await this.convertFirebaseUser(userCredential.user);
    } catch (error) {
      logger.error('Firebase社交账号登录失败', { error, provider: credentials.provider });
      throw new AuthError('社交账号登录失败', 'SOCIAL_SIGN_IN_ERROR');
    }
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
  }

  async refreshToken(): Promise<string> {
    try {
      logger.info('刷新Firebase认证令牌');
      const user = this.auth.currentUser;
      if (!user) {
        throw new AuthError('没有登录用户', 'NOT_AUTHENTICATED');
      }
      const token = await user.getIdToken(true);
      return token;
    } catch (error) {
      logger.error('刷新Firebase认证令牌失败', { error });
      throw new AuthError('刷新令牌失败', 'REFRESH_TOKEN_ERROR');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      logger.info('重置Firebase用户密码', { email });
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      logger.error('重置Firebase用户密码失败', { error, email });
      throw new AuthError('重置密码失败', 'RESET_PASSWORD_ERROR');
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('未登录');
    }
    
    const updatedUser = { ...this.currentUser, ...userData };
    const key = this.currentUser.email || this.currentUser.phoneNumber || '';
    if (key) {
      this.users.set(key, updatedUser);
    }
    this.currentUser = updatedUser;
    
    return updatedUser;
  }

  async sendEmailVerification(): Promise<void> {
    try {
      logger.info('发送Firebase邮箱验证');
      const user = this.auth.currentUser;
      if (!user) {
        throw new AuthError('没有登录用户', 'NOT_AUTHENTICATED');
      }
      await sendEmailVerification(user);
    } catch (error) {
      logger.error('发送Firebase邮箱验证失败', { error });
      throw new AuthError('发送邮箱验证失败', 'SEND_EMAIL_VERIFICATION_ERROR');
    }
  }

  async verifyEmail(code: string): Promise<void> {
    try {
      logger.info('验证Firebase邮箱', { code });
      const user = this.auth.currentUser;
      if (!user) {
        throw new AuthError('没有登录用户', 'NOT_AUTHENTICATED');
      }
      // Firebase会自动验证邮箱，这里只需要重新加载用户信息
      await user.reload();
    } catch (error) {
      logger.error('验证Firebase邮箱失败', { error });
      throw new AuthError('验证邮箱失败', 'VERIFY_EMAIL_ERROR');
    }
  }

  async signInWithProvider(provider: AuthProviderType): Promise<User> {
    try {
      logger.info('Firebase社交账号登录', { provider });
      let authProvider;
      
      switch (provider) {
        case 'google':
          authProvider = new GoogleAuthProvider();
          break;
        case 'facebook':
          authProvider = new FacebookAuthProvider();
          break;
        case 'apple':
          authProvider = new OAuthProvider('apple.com');
          break;
        default:
          throw new AuthError('不支持的社交登录提供商', 'UNSUPPORTED_PROVIDER');
      }
      
      const result = await signInWithPopup(this.auth, authProvider);
      return await this.convertFirebaseUser(result.user);
    } catch (error) {
      logger.error('Firebase社交账号登录失败', { error, provider });
      throw new AuthError('社交账号登录失败', 'SOCIAL_SIGN_IN_ERROR');
    }
  }

  private async convertFirebaseUser(user: FirebaseUser): Promise<User> {
    // 查找现有用户或创建新用户
    const existingUser = this.users.get(user.uid);
    
    if (!existingUser) {
      // 创建新用户
      const newUser: User = {
        id: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: user.displayName || 'New User',
        email: user.email || undefined,
        emailVerified: user.emailVerified,
        phoneVerified: !!user.phoneNumber,
        birthDate: new Date(), // 默认值
        gender: 'other', // 默认值
        photos: [],
        interests: [],
        location: { latitude: 0, longitude: 0, city: 'Unknown', country: 'Unknown' },
        privacySettings: { 
          showProfileToEveryone: true, 
          showOnlineStatus: true, 
          showLastActive: true,
          showInDiscovery: true,
          showDistance: true,
          allowDataCollection: true,
          allowPersonalizedAds: true,
          showEmailToMatches: false,
          showPhoneToMatches: false,
          allowProfileSharing: true
        },
        preferences: { 
          ageRange: { min: 18, max: 50 }, 
          distance: 50, 
          gender: ['female'],
          interests: []
        },
        notificationSettings: { 
          newMatches: true, 
          matchMessages: true, 
          profileViews: true, 
          profileLikes: true, 
          appUpdates: true, 
          promotions: true 
        },
        matching: { completedTests: [], testWeights: {}, testResults: {} },
        isVerified: user.emailVerified || !!user.phoneNumber,
        lastActive: new Date(),
        isOnline: true,
        status: 'active',
        provider: this.getProviderType(user),
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        phoneNumber: user.phoneNumber || undefined
      };
      
      this.users.set(user.uid, newUser);
      return newUser;
    }
    
    return existingUser;
  }

  private getProviderType(user: FirebaseUser): 'email' | 'phone' | 'google' | 'facebook' | 'apple' {
    const providerData = user.providerData[0];
    if (!providerData) return 'email';
    
    switch (providerData.providerId) {
      case 'google.com':
        return 'google';
      case 'facebook.com':
        return 'facebook';
      case 'apple.com':
        return 'apple';
      case 'phone':
        return 'phone';
      default:
        return 'email';
    }
  }
} 