import { AuthProvider, AuthError, PhoneAuthCredentials, AuthProviderType, AuthSession } from '@/core/services/auth/auth-types';
import { User } from '@/core/lib/db/types/user';
import { logger } from '@/core/lib/logger';
import { MockDataService } from '../data/mock-data-service';

/**
 * 模拟认证提供者
 */
export class MockAuthProvider implements AuthProvider {
  private static instance: MockAuthProvider;
  private currentUser: User | null = null;
  private verificationCodes: Map<string, string> = new Map();
  private dataService: MockDataService;
  
  private constructor() {
    this.dataService = MockDataService.getInstance({
      mockMode: 'memory',
      loadDemoData: true,
      demoDataSource: 'dating'
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
      await this.dataService.initialize();
    } catch (error) {
      logger.error('初始化模拟认证失败', { error });
      throw new AuthError('初始化模拟认证失败', 'INIT_ERROR');
    }
  }
  
  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }
  
  private generateAuthSession(user: User): AuthSession {
    return {
      user,
      token: `mock-token-${user.id}-${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };
  }

  async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    const user = await this.dataService.getUserByEmail(email);
    if (!user) {
      throw new AuthError('用户不存在', 'auth/user-not-found');
    }
    
    // 在mock模式下，所有用户都使用相同的密码 "password"
    if (password !== 'password') {
      throw new AuthError('密码错误', 'auth/wrong-password');
    }
    
    this.currentUser = user;
    logger.info('用户登录成功', { userId: user.id, email: user.email });
    return this.generateAuthSession(user);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user = await this.dataService.createUser(userData);
    logger.info('创建用户成功', { userId: user.id, email: user.email });
    return user;
  }

  async getUser(userId: string): Promise<User | null> {
    return this.dataService.getUserById(userId);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.dataService.getUserByEmail(email);
  }

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    const users = await this.dataService.getUsers();
    return users.find(user => user.phoneNumber === phoneNumber) || null;
  }
  
  async signInWithPhone(credentials: PhoneAuthCredentials): Promise<AuthSession> {
    const { phoneNumber, verificationCode } = credentials;
    
    // 验证验证码
    const storedCode = this.verificationCodes.get(phoneNumber);
    if (!storedCode || storedCode !== verificationCode) {
      throw new AuthError('验证码错误或已过期', 'auth/invalid-code');
    }
    
    // 查找或创建用户
    let user = await this.getUserByPhone(phoneNumber);
    if (!user) {
      user = await this.createUser({
        phoneNumber,
        phoneVerified: true
      });
    }
    
    this.currentUser = user;
    logger.info('用户登录成功', { userId: user.id, phoneNumber: user.phoneNumber });
    return this.generateAuthSession(user);
  }
  
  async sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
    // 生成随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationCodes.set(phoneNumber, code);
    
    // 在实际应用中，这里会发送短信
    logger.info(`向 ${phoneNumber} 发送验证码: ${code}`);
  }
  
  async signInWithProvider(provider: AuthProviderType): Promise<AuthSession> {
    if (provider === 'emailAndPassword') {
      throw new AuthError('请使用 signInWithEmail 方法', 'auth/invalid-provider');
    }

    // 创建一个模拟用户
    const user = await this.createUser({
      id: `${provider}-user-${Date.now()}`,
      provider,
      name: `${provider} User`,
      email: `${provider}-user-${Date.now()}@example.com`,
      emailVerified: true,
      displayName: `${provider} User`,
      photoURL: `https://example.com/photos/${provider}-user.jpg`,
      location: { 
        latitude: 39.9042, 
        longitude: 116.4074, 
        city: '北京', 
        country: '中国' 
      },
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
        ageRange: { min: 25, max: 40 }, 
        distance: 50, 
        gender: ['female'],
        interests: ['旅行', '音乐', '美食']
      },
      notificationSettings: { 
        newMatches: true, 
        matchMessages: true, 
        profileViews: true, 
        profileLikes: true, 
        appUpdates: true, 
        promotions: true 
      }
    });
    
    this.currentUser = user;
    logger.info('用户登录成功', { userId: user.id, provider });
    return this.generateAuthSession(user);
  }
  
  async signOut(): Promise<void> {
    this.currentUser = null;
    logger.info('用户已登出');
  }
  
  async updateProfile(userData: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new AuthError('用户未登录', 'auth/not-authenticated');
    }
    return this.updateUser(this.currentUser.id, userData);
  }

  async refreshToken(): Promise<string> {
    if (!this.currentUser) {
      throw new AuthError('用户未登录', 'auth/not-authenticated');
    }
    return `mock-token-${this.currentUser.id}-${Date.now()}`;
  }

  async resetPassword(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new AuthError('用户不存在', 'auth/user-not-found');
    }
    logger.info(`已向 ${email} 发送密码重置邮件`);
  }

  async sendEmailVerification(): Promise<void> {
    if (!this.currentUser) {
      throw new AuthError('用户未登录', 'auth/not-authenticated');
    }
    logger.info(`已向 ${this.currentUser.email} 发送验证邮件`);
  }

  async verifyEmail(code: string): Promise<void> {
    if (!this.currentUser) {
      throw new AuthError('用户未登录', 'auth/not-authenticated');
    }
    await this.updateUser(this.currentUser.id, { emailVerified: true });
    logger.info('邮箱验证成功', { userId: this.currentUser.id });
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const user = await this.dataService.updateUser(userId, userData);
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = user;
    }
    logger.info('用户信息已更新', { userId });
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.dataService.deleteUser(userId);
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = null;
    }
    logger.info('用户已删除', { userId });
  }
} 