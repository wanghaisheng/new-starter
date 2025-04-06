import { AuthProvider, AuthError, PhoneAuthCredentials, AuthProviderType } from '@/core/services/auth/auth-types';
import { User } from '@/core/lib/db/types/user';
import { logger } from '@/core/lib/logger';

/**
 * 模拟认证提供者
 */
export class MockAuthProvider implements AuthProvider {
  private static instance: MockAuthProvider;
  private users: Map<string, User> = new Map();
  private currentUser: User | null = null;
  private verificationCodes: Map<string, string> = new Map();
  
  private constructor() {
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
  
  static getInstance(): MockAuthProvider {
    if (!MockAuthProvider.instance) {
      MockAuthProvider.instance = new MockAuthProvider();
    }
    return MockAuthProvider.instance;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('初始化模拟认证');
      // 模拟初始化完成
    } catch (error) {
      logger.error('初始化模拟认证失败', { error });
      throw new AuthError('初始化模拟认证失败', 'INIT_ERROR');
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
  
  async signInWithProvider(provider: AuthProviderType): Promise<User> {
    // 模拟社交登录
    const userId = Date.now().toString();
    const user: User = {
      id: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      name: `${provider} User`,
      email: `${provider}-user@example.com`,
      emailVerified: true,
      phoneVerified: false,
      birthDate: new Date(),
      gender: 'other',
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
      provider,
      displayName: `${provider} User`,
      photoURL: `https://example.com/avatars/${provider}.jpg`,
      phoneNumber: undefined
    };
    
    this.users.set(user.email || '', user);
    this.currentUser = user;
    return user;
  }
  
  async signOut(): Promise<void> {
    this.currentUser = null;
  }
  
  async updateProfile(userData: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('未登录');
    }
    
    const updatedUser = { ...this.currentUser, ...userData, updatedAt: new Date() };
    const key = this.currentUser.email || this.currentUser.phoneNumber || '';
    
    this.users.set(key, updatedUser);
    this.currentUser = updatedUser;
    return updatedUser;
  }

  async refreshToken(): Promise<string> {
    if (!this.currentUser) {
      throw new AuthError('未登录', 'auth/no-user');
    }
    
    // 模拟刷新令牌
    return `mock-token-${Date.now()}`;
  }

  async resetPassword(email: string): Promise<void> {
    const user = this.users.get(email);
    if (!user) {
      throw new AuthError('用户不存在', 'auth/user-not-found');
    }
    
    // 模拟发送重置密码邮件
    console.log(`向 ${email} 发送重置密码邮件`);
  }

  async sendEmailVerification(): Promise<void> {
    if (!this.currentUser) {
      throw new AuthError('未登录', 'auth/no-user');
    }
    
    if (!this.currentUser.email) {
      throw new AuthError('用户没有邮箱', 'auth/no-email');
    }
    
    // 模拟发送验证邮件
    console.log(`向 ${this.currentUser.email} 发送验证邮件`);
  }

  async verifyEmail(code: string): Promise<void> {
    if (!this.currentUser) {
      throw new AuthError('未登录', 'auth/no-user');
    }
    
    if (!this.currentUser.email) {
      throw new AuthError('用户没有邮箱', 'auth/no-email');
    }
    
    // 模拟验证邮箱
    const updatedUser = {
      ...this.currentUser,
      emailVerified: true,
      isVerified: true,
      updatedAt: new Date()
    };
    
    const key = this.currentUser.email;
    this.users.set(key, updatedUser);
    this.currentUser = updatedUser;
  }
} 