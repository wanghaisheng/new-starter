import { DatabaseService } from '@/core/lib/db/service';
import { User, UserPreferences } from '@/core/lib/db/types';
import { IAuthService } from './auth-service';

/**
 * Mock 认证服务实现
 * 使用预定义的测试账号进行认证，适用于开发和测试阶段
 */
export class MockAuthService implements IAuthService {
  private static instance: MockAuthService | null = null;
  private db: DatabaseService;
  private currentUser: User | null = null;
  private mockUsers: Map<string, string> = new Map(); // email -> password
  private mockPhones: Map<string, string> = new Map(); // phone -> code
  private mockPhoneCodes: Map<string, string> = new Map(); // phone -> code

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.initializeMockUsers();
  }

  /**
   * 初始化模拟用户数据
   */
  private initializeMockUsers(): void {
    try {
      // 从环境变量获取模拟用户
      const mockUsersStr = process.env.NEXT_PUBLIC_MOCK_AUTH_USERS || '';
      const mockPhonesStr = process.env.NEXT_PUBLIC_MOCK_AUTH_PHONES || '';

      // 解析邮箱和密码
      if (mockUsersStr) {
        mockUsersStr.split(',').forEach(pair => {
          const [email, password] = pair.split(':');
          if (email && password) {
            this.mockUsers.set(email, password);
          }
        });
      }

      // 解析手机号和验证码
      if (mockPhonesStr) {
        mockPhonesStr.split(',').forEach(pair => {
          const [phone, code] = pair.split(':');
          if (phone && code) {
            this.mockPhones.set(phone, code);
          }
        });
      }

      console.log('Mock auth service initialized with users:', 
        Array.from(this.mockUsers.keys()).join(', '));
    } catch (error) {
      console.error('Failed to initialize mock users:', error);
    }
  }

  public static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService();
    }
    return MockAuthService.instance;
  }

  /**
   * 使用邮箱和密码登录
   */
  public async login(email: string, password: string): Promise<User> {
    try {
      // 检查是否是模拟用户
      const mockPassword = this.mockUsers.get(email);
      if (mockPassword && mockPassword === password) {
        console.log(`Mock login successful for ${email}`);
        
        // 从数据库获取用户信息
        const user = await this.db.getUserRepository().findByEmail(email);
        if (!user) {
          // 如果用户不存在，创建一个模拟用户
          const now = new Date();
          const newUser: User = {
            id: `mock-${Date.now()}`,
            email,
            name: email.split('@')[0],
            phone: '',
            googleId: '',
            bio: 'Mock user for testing',
            birthDate: new Date('1990-01-01'),
            gender: 'other',
            photos: [],
            interests: ['testing', 'mock'],
            location: { latitude: 0, longitude: 0, city: 'Mock City', country: 'Mock Country' },
            preferences: {
              distance: 50,
              ageRange: { min: 18, max: 99 },
              gender: ['female', 'male'],
              interests: ['testing', 'mock']
            },
            isVerified: true,
            lastActive: now,
            status: 'active',
            createdAt: now,
            updatedAt: now
          };
          
          // 保存到数据库
          await this.db.getUserRepository().create(newUser);
          this.currentUser = newUser;
          return newUser;
        }
        
        this.currentUser = user;
        return user;
      }
      
      // 如果不是模拟用户，尝试从数据库查找
      const user = await this.db.getUserRepository().findByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      
      // 在mock环境中，我们跳过密码验证
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Mock login failed:', error);
      throw error;
    }
  }

  /**
   * 使用手机号和验证码登录
   */
  public async loginWithPhone(phoneNumber: string, verificationCode: string): Promise<User> {
    try {
      // 检查是否是模拟手机号
      const mockCode = this.mockPhones.get(phoneNumber);
      if (mockCode && mockCode === verificationCode) {
        console.log(`Mock phone login successful for ${phoneNumber}`);
        
        // 从数据库获取用户信息
        const user = await this.db.getUserRepository().findByPhone(phoneNumber);
        if (!user) {
          // 如果用户不存在，创建一个模拟用户
          const now = new Date();
          const newUser: User = {
            id: `mock-${Date.now()}`,
            email: `mock-${phoneNumber.replace('+', '')}@example.com`,
            name: `Mock User ${phoneNumber.slice(-4)}`,
            phone: phoneNumber,
            googleId: '',
            bio: 'Mock user for testing',
            birthDate: new Date('1990-01-01'),
            gender: 'other',
            photos: [],
            interests: ['testing', 'mock'],
            location: { latitude: 0, longitude: 0, city: 'Mock City', country: 'Mock Country' },
            preferences: {
              distance: 50,
              ageRange: { min: 18, max: 99 },
              gender: ['female', 'male'],
              interests: ['testing', 'mock']
            },
            isVerified: true,
            lastActive: now,
            status: 'active',
            createdAt: now,
            updatedAt: now
          };
          
          // 保存到数据库
          await this.db.getUserRepository().create(newUser);
          this.currentUser = newUser;
          return newUser;
        }
        
        this.currentUser = user;
        return user;
      }
      
      // 如果不是模拟手机号，尝试从数据库查找
      const user = await this.db.getUserRepository().findByPhone(phoneNumber);
      if (!user) {
        throw new Error('User not found');
      }
      
      // 在mock环境中，我们跳过验证码验证
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Mock phone login failed:', error);
      throw error;
    }
  }

  /**
   * 发送验证码到指定手机号
   */
  public async sendVerificationCode(phoneNumber: string): Promise<void> {
    try {
      // 生成随机验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 存储验证码
      this.mockPhoneCodes.set(phoneNumber, code);
      
      console.log(`Mock sending verification code ${code} to ${phoneNumber}`);
      
      // 如果是预定义的模拟手机号，使用预定义的验证码
      if (this.mockPhones.has(phoneNumber)) {
        this.mockPhoneCodes.set(phoneNumber, this.mockPhones.get(phoneNumber) || '');
      }
    } catch (error) {
      console.error('Failed to send verification code:', error);
      throw error;
    }
  }

  /**
   * 登出当前用户
   */
  public async logout(): Promise<void> {
    this.currentUser = null;
    console.log('Mock logout successful');
  }

  /**
   * 获取当前登录用户
   */
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * 检查用户是否已认证
   */
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
} 