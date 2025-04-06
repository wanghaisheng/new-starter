import { IAuthService } from '../auth-service';
import { User, PrivacySettings, NotificationSettings } from '@/core/lib/db/types/user';
import { Photo } from '@/core/lib/db/types/photo';
import { Location } from '@/core/lib/db/types/location';
import { AuthEventManager, AuthEventType, AuthEventData } from '../auth-events';

interface MockAuthConfig {
  enableDelay: boolean;
  mockUserCount: number;
  defaultPassword?: string;
  persistAuth?: boolean; // 是否持久化认证状态
}

export class MockAuthService implements IAuthService {
  private config: MockAuthConfig;
  private mockUsers: Map<string, User> = new Map();
  private currentUser: User | null = null;
  private readonly STORAGE_KEY = 'mock_auth_current_user';
  private eventManager: AuthEventManager;
  
  constructor(config: MockAuthConfig) {
    this.config = config;
    this.eventManager = AuthEventManager.getInstance();
    this.initializeMockUsers();
    
    // 如果启用了持久化，尝试从存储中恢复用户
    if (this.config.persistAuth) {
      this.loadPersistedUser();
    }
  }
  
  private async delay(ms: number): Promise<void> {
    if (this.config.enableDelay) {
      await new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  
  private loadPersistedUser(): void {
    if (this.config.persistAuth && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem(this.STORAGE_KEY);
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
          console.log('Loaded persisted user:', this.currentUser?.email);
        }
      } catch (error) {
        console.error('Failed to load persisted user:', error);
      }
    }
  }
  
  private persistUser(user: User | null): void {
    if (this.config.persistAuth && typeof window !== 'undefined') {
      try {
        if (user) {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        } else {
          localStorage.removeItem(this.STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to persist user:', error);
      }
    }
  }
  
  private initializeMockUsers(): void {
    for (let i = 1; i <= this.config.mockUserCount; i++) {
      const user: User = {
        id: `mock-user-${i}`,
        email: `user${i}@example.com`,
        name: `Mock User ${i}`,
        phone: `+8613800138${i.toString().padStart(4, '0')}`,
        birthDate: new Date(1990, 0, 1),
        gender: i % 2 === 0 ? 'male' : 'female',
        photos: [{
          id: `photo-${i}`,
          url: `https://picsum.photos/200/200?random=${i}`,
          order: 0,
          isMain: true,
          userId: `mock-user-${i}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        bio: `This is mock user ${i}'s bio`,
        interests: ['reading', 'music', 'travel'],
        location: {
          latitude: 39.9042 + (Math.random() - 0.5) * 0.1,
          longitude: 116.4074 + (Math.random() - 0.5) * 0.1,
          city: 'Beijing',
          country: 'China'
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
          ageRange: { min: 18, max: 35 },
          distance: 50,
          gender: ['male', 'female', 'other'],
          interests: ['reading', 'music', 'travel']
        },
        notificationSettings: {
          newMatches: true,
          matchMessages: true,
          profileViews: true,
          profileLikes: true,
          appUpdates: true,
          promotions: false
        },
        isVerified: true,
        lastActive: new Date(),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.mockUsers.set(user.id, user);
    }
  }
  
  /**
   * 发送认证事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  private emitEvent(eventType: AuthEventType, data: AuthEventData): void {
    this.eventManager.emit(eventType, data);
  }
  
  async login(email: string, password: string): Promise<User> {
    await this.delay(500);
    
    try {
      const user = Array.from(this.mockUsers.values()).find(u => u.email === email);
      if (!user) {
        const error = new Error('User not found');
        this.emitEvent(AuthEventType.ERROR, {
          user: undefined,
          error: error,
          timestamp: Date.now()
        });
        throw error;
      }
      
      if (password !== this.config.defaultPassword) {
        const error = new Error('Invalid password');
        this.emitEvent(AuthEventType.ERROR, {
          user: undefined,
          error: error,
          timestamp: Date.now()
        });
        throw error;
      }
      
      this.currentUser = user;
      this.persistUser(user);
      this.emitEvent(AuthEventType.LOGIN, {
        user: user,
        timestamp: Date.now()
      });
      return user;
    } catch (error) {
      this.emitEvent(AuthEventType.ERROR, {
        user: undefined,
        error: error as Error,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  async loginWithPhone(phoneNumber: string, verificationCode: string): Promise<User> {
    await this.delay(500);
    
    try {
      const user = Array.from(this.mockUsers.values()).find(u => u.phone === phoneNumber);
      if (!user) {
        const error = new Error('User not found');
        this.emitEvent(AuthEventType.ERROR, {
          user: undefined,
          error: error,
          timestamp: Date.now()
        });
        throw error;
      }
      
      if (verificationCode !== '123456') { // 模拟验证码
        const error = new Error('Invalid verification code');
        this.emitEvent(AuthEventType.ERROR, {
          user: undefined,
          error: error,
          timestamp: Date.now()
        });
        throw error;
      }
      
      this.currentUser = user;
      this.persistUser(user);
      this.emitEvent(AuthEventType.LOGIN, {
        user: user,
        timestamp: Date.now()
      });
      return user;
    } catch (error) {
      this.emitEvent(AuthEventType.ERROR, {
        user: undefined,
        error: error as Error,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    await this.delay(500);
    // 模拟发送验证码
    console.log(`Verification code 123456 sent to ${phoneNumber}`);
  }
  
  async register(userData: Partial<User>): Promise<User> {
    await this.delay(800);
    
    const id = `mock-user-${this.mockUsers.size + 1}`;
    const user: User = {
      id,
      email: userData.email || `user${id}@example.com`,
      name: userData.name || `Mock User ${id}`,
      phone: userData.phone || `+8613800138${id}`,
      birthDate: userData.birthDate || new Date(1990, 0, 1),
      gender: userData.gender || 'male',
      photos: userData.photos || [{
        id: `photo-${id}`,
        url: `https://picsum.photos/200/200?random=${id}`,
        order: 0,
        isMain: true,
        userId: id,
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      bio: userData.bio || `This is mock user ${id}'s bio`,
      interests: userData.interests || ['reading', 'music', 'travel'],
      location: userData.location || {
        latitude: 39.9042,
        longitude: 116.4074,
        city: 'Beijing',
        country: 'China'
      },
      privacySettings: userData.privacySettings || {
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
      preferences: userData.preferences || {
        ageRange: { min: 18, max: 35 },
        distance: 50,
        gender: ['male', 'female', 'other'],
        interests: ['reading', 'music', 'travel']
      },
      notificationSettings: userData.notificationSettings || {
        newMatches: true,
        matchMessages: true,
        profileViews: true,
        profileLikes: true,
        appUpdates: true,
        promotions: false
      },
      isVerified: true,
      lastActive: new Date(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.mockUsers.set(id, user);
    return user;
  }
  
  async logout(): Promise<void> {
    await this.delay(300);
    const user = this.currentUser || undefined;
    this.currentUser = null;
    this.persistUser(null);
    this.emitEvent(AuthEventType.LOGOUT, {
      user: user,
      timestamp: Date.now()
    });
  }
  
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  /**
   * 检查用户是否已认证
   */
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
  
  /**
   * 更新用户资料
   * @param userData 要更新的用户数据
   * @returns 更新后的用户信息
   */
  public async updateProfile(userData: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('用户未登录，无法更新资料');
    }
    
    try {
      // 模拟网络延迟
      if (this.config.enableDelay) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 更新用户数据
      const updatedUser = {
        ...this.currentUser,
        ...userData,
        updatedAt: new Date()
      };
      
      // 更新内存中的用户数据
      this.mockUsers.set(this.currentUser.id, updatedUser);
      this.currentUser = updatedUser;
      
      // 如果启用了持久化，更新存储
      if (this.config.persistAuth) {
        this.persistUser(updatedUser);
      }
      
      // 发送事件
      this.emitEvent(AuthEventType.PROFILE_UPDATED, { 
        user: updatedUser,
        timestamp: Date.now()
      });
      
      return updatedUser;
    } catch (error) {
      console.error('更新用户资料失败:', error);
      this.emitEvent(AuthEventType.ERROR, { 
        error: error as Error,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  async resetPassword(email: string): Promise<void> {
    await this.delay(1000);
    // 模拟发送重置密码邮件
  }
  
  async verifyEmail(token: string): Promise<void> {
    await this.delay(500);
    // 模拟验证邮箱
  }
  
  async sendVerificationEmail(): Promise<void> {
    await this.delay(500);
    // 模拟发送验证邮件
  }

  /**
   * 发送密码重置邮件
   * @param email 用户邮箱
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    await this.delay(500);
    console.log(`Mock sending password reset email to ${email}`);
  }

  /**
   * 验证密码重置代码
   * @param code 重置代码
   * @returns 重置代码对应的邮箱地址
   */
  async verifyPasswordResetCode(code: string): Promise<string> {
    await this.delay(500);
    console.log(`Mock verifying password reset code: ${code}`);
    return 'test@example.com'; // 模拟返回邮箱
  }

  /**
   * 确认密码重置
   * @param code 重置代码
   * @param newPassword 新密码
   */
  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    await this.delay(500);
    console.log(`Mock confirming password reset with code: ${code}`);
  }

  /**
   * 发送邮箱验证邮件
   */
  async sendEmailVerification(): Promise<void> {
    await this.delay(500);
    if (!this.currentUser) {
      throw new Error('No user is signed in');
    }
    console.log('Mock sending email verification');
  }

  /**
   * 应用邮箱验证代码
   * @param code 验证代码
   */
  async applyActionCode(code: string): Promise<void> {
    await this.delay(500);
    console.log(`Mock applying action code: ${code}`);
  }

  /**
   * 更新用户邮箱
   * @param newEmail 新邮箱地址
   */
  async updateEmail(newEmail: string): Promise<void> {
    await this.delay(500);
    if (!this.currentUser) {
      throw new Error('No user is signed in');
    }
    console.log(`Mock updating email to: ${newEmail}`);
    // 更新数据库中的用户邮箱
    if (this.currentUser) {
      this.currentUser.email = newEmail;
      this.persistUser(this.currentUser);
    }
  }

  /**
   * 更新用户密码
   * @param newPassword 新密码
   */
  async updatePassword(newPassword: string): Promise<void> {
    await this.delay(500);
    if (!this.currentUser) {
      throw new Error('No user is signed in');
    }
    console.log('Mock updating password');
  }
} 