import { AuthProvider, AuthProviderType, AuthSession, PhoneAuthCredentials, AuthServiceType } from './auth-types';
import { AuthError } from './auth-error';
import { User } from '@/core/lib/db/types/user';
import { Location } from '@/core/lib/db/types/location';
import { logger } from '@/core/lib/logger';
import { DataServiceFactory } from '@/core/services/data/data-service-factory';

export interface UnifiedAuthConfig {
  type: AuthServiceType;
  registerUser?: (email: string, password: string) => Promise<User>;
  sendPasswordResetEmail?: (email: string) => Promise<void>;
}

/**
 * Unified auth provider implementation
 * This provider uses the appropriate data source based on the environment
 */
export class UnifiedAuthProvider implements AuthProvider {
  private currentUser: User | null = null;
  private readonly tokenExpirationHours = 24;
  private users: Map<string, User> = new Map();
  private config: UnifiedAuthConfig;
  
  constructor(config: UnifiedAuthConfig) {
    this.config = config;
    logger.info('Initializing UnifiedAuthProvider with config', { type: config.type });
  }
  
  async initialize(): Promise<void> {
    logger.info('Initializing UnifiedAuthProvider');
  }
  
  private generateToken(userId: string): string {
    // 在实际应用中，这里应该使用 JWT 或其他安全的 token 生成方法
    // 这里我们只是生成一个简单的 token 用于演示
    const timestamp = Date.now();
    return `${userId}-${timestamp}`;
  }
  
  private createAuthSession(user: User): AuthSession {
    const token = this.generateToken(user.id);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.tokenExpirationHours);

    return {
      user,
      token,
      expiresAt
    };
  }
  
  private createDefaultUser(id: string, email: string, name: string): User {
    const now = new Date();
    const defaultLocation: Location = {
      latitude: 0,
      longitude: 0,
      city: '',
      country: ''
    };

    return {
      id,
      email,
      name,
      birthDate: new Date('1990-01-01'),
      gender: 'other',
      photos: [],
      interests: [],
      location: defaultLocation,
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
        ageRange: { min: 18, max: 99 },
        distance: 100,
        gender: ['male', 'female', 'other'],
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
      matching: {
        completedTests: [],
        testWeights: {},
        testResults: {}
      },
      isVerified: false,
      lastActive: now,
      isOnline: true,
      status: 'active',
      createdAt: now,
      updatedAt: now
    };
  }
  
  async signInWithEmail(email: string, password: string): Promise<AuthSession> {
    logger.info('Attempting email sign in', { email });
    
    // 从数据库查询用户
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new AuthError('用户不存在', 'auth/user-not-found');
    }
    
    // 验证密码
    if (password !== 'password') { // 在生产环境中应该使用密码哈希
      throw new AuthError('密码错误', 'auth/wrong-password');
    }
    
    this.currentUser = user;
    return this.createAuthSession(user);
  }
  
  async signInWithPhone(credentials: PhoneAuthCredentials): Promise<AuthSession> {
    logger.info('Attempting phone sign in', { phoneNumber: credentials.phoneNumber });
    throw new AuthError('Phone authentication not implemented', 'auth/not-implemented');
  }
  
  async signInWithProvider(provider: AuthProviderType): Promise<AuthSession> {
    logger.info('Attempting provider sign in', { provider });
    
    if (provider === 'emailAndPassword') {
      throw new AuthError('Use signInWithEmail for email/password authentication', 'auth/invalid-provider');
    }

    const user = this.createDefaultUser(
      `provider-${provider}-user-id`,
      `${provider}@example.com`,
      `${provider} User`
    );

    this.currentUser = user;
    this.users.set(user.id, user);
    logger.info('Provider user signed in successfully', { provider });
    
    return this.createAuthSession(user);
  }
  
  async signUpWithEmail(email: string, password: string, name: string): Promise<User> {
    logger.info('Signing up with email', { email, name });
    
    try {
      const user = await this.config.registerUser!(email, password);
      this.currentUser = user;
      logger.info('User signed up successfully', { userId: user.id });
      return user;
    } catch (error) {
      logger.error('Failed to sign up with email', { email, error });
      throw error;
    }
  }
  
  async signOut(): Promise<void> {
    logger.info('Signing out user');
    this.currentUser = null;
  }
  
  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }
  
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
  
  async sendPasswordResetEmail(email: string): Promise<void> {
    if (!this.config.sendPasswordResetEmail) {
      throw new AuthError('Password reset not supported', 'auth/operation-not-supported');
    }
    return this.config.sendPasswordResetEmail(email);
  }
  
  async updateProfile(userData: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new AuthError('No user is currently signed in', 'auth/no-current-user');
    }

    const updatedUser = { ...this.currentUser, ...userData, updatedAt: new Date() };
    this.currentUser = updatedUser;
    this.users.set(updatedUser.id, updatedUser);
    return updatedUser;
  }
  
  async sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
    logger.info('Sending phone verification code', { phoneNumber });
    throw new AuthError('Phone verification not implemented', 'auth/not-implemented');
  }
  
  async refreshToken(): Promise<string> {
    if (!this.currentUser) {
      throw new AuthError('No user is currently signed in', 'auth/no-current-user');
    }

    return this.generateToken(this.currentUser.id);
  }
  
  async resetPassword(email: string): Promise<void> {
    if (!this.config.sendPasswordResetEmail) {
      throw new AuthError('Password reset not supported', 'auth/operation-not-supported');
    }
    return this.config.sendPasswordResetEmail(email);
  }

  async sendEmailVerification(): Promise<void> {
    logger.info('Sending email verification');
    throw new AuthError('Email verification not implemented', 'auth/not-implemented');
  }

  async verifyEmail(code: string): Promise<void> {
    logger.info('Verifying email', { code });
    throw new AuthError('Email verification not implemented', 'auth/not-implemented');
  }

  async createUser(data: Partial<User>): Promise<User> {
    if (!this.config.registerUser) {
      throw new AuthError('User registration not supported', 'auth/operation-not-supported');
    }
    if (!data.email) {
      throw new AuthError('Email is required', 'auth/invalid-email');
    }
    // We use a default password for now since the interface doesn't support passing it
    return this.config.registerUser(data.email, 'defaultPassword');
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // First check in-memory users
    const users = Array.from(this.users.values());
    for (const user of users) {
      if (user.email === email) {
        return user;
      }
    }

    // If not found in memory, check database
    try {
      const dataService = DataServiceFactory.getDataService();
      const result = await dataService.getUsers();
      const user = result.find(u => u.email === email);
      if (user) {
        this.users.set(user.id, user); // Cache the user
        return user;
      }
    } catch (error) {
      logger.error('Error querying database for user', { email, error });
    }

    return null;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    logger.info('Getting user by phone', { phoneNumber });
    throw new AuthError('Phone lookup not implemented', 'auth/not-implemented');
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new AuthError('User not found', 'auth/user-not-found');
    }

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    if (!this.users.has(id)) {
      throw new AuthError('User not found', 'auth/user-not-found');
    }

    this.users.delete(id);
    if (this.currentUser?.id === id) {
      this.currentUser = null;
    }
  }
} 