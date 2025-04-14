import { User } from '@/core/lib/db/types/user';
import { AuthError } from './auth-error';
import { AuthProviderType } from './auth-provider';
import { Logger } from '@/core/lib/utils/logger';

const logger = new Logger('AuthDataSource');

/**
 * Interface for authentication data sources
 * This allows us to use different data sources in different environments
 */
export interface AuthDataSource {
  /**
   * Authenticate a user with email and password
   * @param email User's email
   * @param password User's password
   * @returns Authenticated user
   * @throws AuthError if authentication fails
   */
  authenticateUser(email: string, password: string): Promise<User>;
  
  /**
   * Authenticate a user with a third-party provider
   * @param provider The provider to use for authentication
   * @returns Authenticated user
   * @throws AuthError if authentication fails
   */
  authenticateWithProvider(provider: AuthProviderType): Promise<User>;
  
  /**
   * Register a new user with email and password
   * @param email User's email
   * @param password User's password
   * @param name User's name
   * @returns Newly created user
   * @throws AuthError if registration fails
   */
  registerUser(email: string, password: string, name: string): Promise<User>;
  
  /**
   * Get a user by email
   * @param email User's email
   * @returns User or null if not found
   */
  getUserByEmail(email: string): Promise<User | null>;
  
  /**
   * Get a user by ID
   * @param id User's ID
   * @returns User or null if not found
   */
  getUserById(id: string): Promise<User | null>;
  
  /**
   * Update a user's profile
   * @param id User's ID
   * @param userData The user data to update
   * @returns The updated user
   * @throws AuthError if the update fails
   */
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  
  /**
   * Send a password reset email
   * @param email The email address to send the reset link to
   * @returns Promise that resolves when the email is sent
   * @throws AuthError if the email doesn't exist or sending fails
   */
  sendPasswordResetEmail(email: string): Promise<void>;
}

/**
 * Mock data source for authentication
 * Used in mock environment
 */
export class MockAuthDataSource implements AuthDataSource {
  private users: Map<string, User> = new Map();
  private currentUser: User | null = null;
  
  constructor() {
    logger.info('Initializing MockAuthDataSource');
    this.initializeDemoUser();
  }
  
  private initializeDemoUser(): void {
    const demoUser: User = {
      id: 'demo-user-1',
      name: 'Demo User',
      email: 'demo@example.com',
      phoneNumber: '13800000000',
      birthDate: new Date('1990-01-01'),
      gender: 'male',
      bio: '这是一个演示用户，用于测试登录功能。使用密码 "password" 登录。',
      interests: ['编程', '旅行', '音乐'],
      photos: [
        {
          id: 'photo-demo-1',
          url: 'https://example.com/photos/demo-1.jpg',
          isMain: true,
          order: 1,
          userId: 'demo-user-1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      location: {
        latitude: 39.9042,
        longitude: 116.4074,
        city: '北京',
        country: '中国'
      },
      preferences: {
        ageRange: {
          min: 25,
          max: 40
        },
        distance: 50,
        gender: ['female'],
        interests: ['旅行', '音乐', '美食']
      },
      isVerified: true,
      lastActive: new Date(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: true,
      phoneVerified: true,
      isOnline: true,
      provider: 'email',
      displayName: 'Demo User',
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
      notificationSettings: {
        newMatches: true,
        matchMessages: true,
        profileViews: true,
        profileLikes: true,
        appUpdates: true,
        promotions: false
      },
      matching: {
        completedTests: [],
        testWeights: {},
        testResults: {}
      }
    };
    
    this.users.set(demoUser.email, demoUser);
    logger.info('Demo user initialized', { email: demoUser.email });
  }
  
  async authenticateUser(email: string, password: string): Promise<User> {
    logger.info('Authenticating user', { email });
    
    // In mock mode, all users have the same password: "password"
    if (password !== 'password') {
      logger.warn('Invalid password for user', { email });
      throw new AuthError('密码错误', 'auth/wrong-password');
    }
    
    const user = this.users.get(email);
    if (!user) {
      logger.warn('User not found', { email });
      throw new AuthError('用户不存在', 'auth/user-not-found');
    }
    
    this.currentUser = user;
    logger.info('User authenticated successfully', { userId: user.id });
    return user;
  }
  
  async authenticateWithProvider(provider: AuthProviderType): Promise<User> {
    logger.info('Authenticating with provider', { provider });
    
    if (provider === 'emailAndPassword') {
      throw new AuthError('请使用 authenticateUser 方法进行邮箱密码登录', 'auth/invalid-provider');
    }
    
    // For other providers, create a new user with the provider type
    const email = `mock-${provider}@example.com`;
    const user: User = {
      id: `mock-${provider}-${Date.now()}`,
      email,
      name: `Mock ${provider} User`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      birthDate: new Date(),
      gender: 'other',
      photos: [],
      interests: [],
      location: {
        latitude: 0,
        longitude: 0,
        city: '',
        country: '',
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
        allowProfileSharing: true,
      },
      preferences: {
        ageRange: { min: 18, max: 100 },
        distance: 50,
        gender: ['male', 'female', 'other'],
        interests: [],
      },
      notificationSettings: {
        newMatches: true,
        matchMessages: true,
        profileViews: true,
        profileLikes: true,
        appUpdates: true,
        promotions: true,
      },
      matching: {
        completedTests: [],
        testWeights: {},
        testResults: {},
      },
      isVerified: true,
      lastActive: new Date(),
      isOnline: true,
      status: 'active',
    };
    
    // Fix for the string | undefined issue by ensuring email is defined
    this.users.set(email, user);
    this.currentUser = user;
    logger.info('User authenticated with provider successfully', { userId: user.id, provider });
    return user;
  }
  
  async registerUser(email: string, password: string, name: string): Promise<User> {
    logger.info('Registering new user', { email, name });
    
    if (this.users.has(email)) {
      logger.warn('User already exists', { email });
      throw new AuthError('用户已存在', 'auth/user-already-exists');
    }
    
    const user: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      birthDate: new Date(),
      gender: 'other',
      photos: [],
      interests: [],
      location: {
        latitude: 0,
        longitude: 0,
        city: '',
        country: '',
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
        allowProfileSharing: true,
      },
      preferences: {
        ageRange: { min: 18, max: 100 },
        distance: 50,
        gender: ['male', 'female', 'other'],
        interests: [],
      },
      notificationSettings: {
        newMatches: true,
        matchMessages: true,
        profileViews: true,
        profileLikes: true,
        appUpdates: true,
        promotions: true,
      },
      matching: {
        completedTests: [],
        testWeights: {},
        testResults: {},
      },
      isVerified: false,
      lastActive: new Date(),
      isOnline: true,
      status: 'active',
    };
    
    this.users.set(email, user);
    this.currentUser = user;
    logger.info('User registered successfully', { userId: user.id });
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.get(email) || null;
  }
  
  async getUserById(id: string): Promise<User | null> {
    // Fix for the MapIterator issue by converting to array first
    const userArray = Array.from(this.users.values());
    for (const user of userArray) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.getUserById(id);
    if (!user) {
      throw new AuthError('用户不存在', 'auth/user-not-found');
    }
    
    const updatedUser = { ...user, ...userData, updatedAt: new Date() };
    // Fix for the string | undefined issue by ensuring email is defined
    if (user.email) {
      this.users.set(user.email, updatedUser);
    }
    
    if (this.currentUser && this.currentUser.id === id) {
      this.currentUser = updatedUser;
    }
    
    return updatedUser;
  }
  
  async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      throw new AuthError('用户不存在', 'auth/user-not-found');
    }
    
    // In mock mode, just log that we would send an email
    logger.info('Password reset email would be sent', { email });
  }
  
  getCurrentUser(): User | null {
    return this.currentUser;
  }
}

/**
 * Local data source for authentication
 * Used in development environment
 */
export class LocalAuthDataSource implements AuthDataSource {
  // Implementation for local environment
  // This would use a local database or storage
  
  async authenticateUser(email: string, password: string): Promise<User> {
    // Implementation for local environment
    throw new Error('Method not implemented.');
  }
  
  async authenticateWithProvider(provider: AuthProviderType): Promise<User> {
    // Implementation for local environment
    throw new Error('Method not implemented.');
  }
  
  async registerUser(email: string, password: string, name: string): Promise<User> {
    // Implementation for local environment
    throw new Error('Method not implemented.');
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    // Implementation for local environment
    throw new Error('Method not implemented.');
  }
  
  async getUserById(id: string): Promise<User | null> {
    // Implementation for local environment
    throw new Error('Method not implemented.');
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    // Implementation for local environment
    throw new Error('Method not implemented.');
  }
  
  async sendPasswordResetEmail(email: string): Promise<void> {
    // Implementation for local environment
    throw new Error('Method not implemented.');
  }
}

/**
 * Cloud data source for authentication
 * Used in production environment
 */
export class CloudAuthDataSource implements AuthDataSource {
  // Implementation for cloud environment
  // This would use a cloud service like Firebase Auth
  
  async authenticateUser(email: string, password: string): Promise<User> {
    // Implementation for cloud environment
    throw new Error('Method not implemented.');
  }
  
  async authenticateWithProvider(provider: AuthProviderType): Promise<User> {
    // Implementation for cloud environment
    throw new Error('Method not implemented.');
  }
  
  async registerUser(email: string, password: string, name: string): Promise<User> {
    // Implementation for cloud environment
    throw new Error('Method not implemented.');
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    // Implementation for cloud environment
    throw new Error('Method not implemented.');
  }
  
  async getUserById(id: string): Promise<User | null> {
    // Implementation for cloud environment
    throw new Error('Method not implemented.');
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    // Implementation for cloud environment
    throw new Error('Method not implemented.');
  }
  
  async sendPasswordResetEmail(email: string): Promise<void> {
    // Implementation for cloud environment
    throw new Error('Method not implemented.');
  }
} 