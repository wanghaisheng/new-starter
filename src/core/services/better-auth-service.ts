import { DatabaseService } from '@/core/lib/db/service';
import { User } from '@/core/lib/db/types';
import { IAuthService } from './auth-service';
import { getAuthConfig } from '@/core/config/auth-config';

/**
 * Better Auth 认证服务实现
 * 使用自定义的认证服务进行用户认证
 */
export class BetterAuthService implements IAuthService {
  private static instance: BetterAuthService | null = null;
  private db: DatabaseService;
  private currentUser: User | null = null;
  private apiKey: string;
  private apiUrl: string;

  private constructor() {
    this.db = DatabaseService.getInstance();
    const config = getAuthConfig();
    this.apiKey = config.better?.apiKey || '';
    this.apiUrl = config.better?.apiUrl || 'https://api.better-auth.com';
  }

  public static getInstance(): BetterAuthService {
    if (!BetterAuthService.instance) {
      BetterAuthService.instance = new BetterAuthService();
    }
    return BetterAuthService.instance;
  }

  /**
   * 使用邮箱和密码登录
   */
  public async login(email: string, password: string): Promise<User> {
    try {
      // 调用 Better Auth API 进行邮箱密码登录
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const { token, userId } = await response.json();
      
      // 从数据库获取用户信息
      const user = await this.db.getUserRepository().findByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      // 存储认证令牌
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_id', userId);
      
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Better Auth login failed:', error);
      throw error;
    }
  }

  /**
   * 使用手机号和验证码登录
   */
  public async loginWithPhone(phoneNumber: string, verificationCode: string): Promise<User> {
    try {
      // 调用 Better Auth API 进行手机号验证码登录
      const response = await fetch(`${this.apiUrl}/auth/phone/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ phoneNumber, verificationCode })
      });

      if (!response.ok) {
        throw new Error('Phone login failed');
      }

      const { token, userId } = await response.json();
      
      // 从数据库获取用户信息
      const user = await this.db.getUserRepository().findByPhone(phoneNumber);
      if (!user) {
        throw new Error('User not found');
      }

      // 存储认证令牌
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_id', userId);
      
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Better Auth phone login failed:', error);
      throw error;
    }
  }

  /**
   * 发送验证码到指定手机号
   */
  public async sendVerificationCode(phoneNumber: string): Promise<void> {
    try {
      // 调用 Better Auth API 发送验证码
      const response = await fetch(`${this.apiUrl}/auth/phone/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code');
      }

      console.log(`Better Auth sending verification code to ${phoneNumber}`);
    } catch (error) {
      console.error('Failed to send verification code:', error);
      throw error;
    }
  }

  /**
   * 登出当前用户
   */
  public async logout(): Promise<void> {
    try {
      // 清除本地存储的认证信息
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      
      this.currentUser = null;
    } catch (error) {
      console.error('Better Auth logout failed:', error);
      throw error;
    }
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
    const token = localStorage.getItem('auth_token');
    return token !== null && this.currentUser !== null;
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
      // 构建请求头
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      };
      
      // 发送更新请求
      const response = await fetch(`${this.apiUrl}/users/${this.currentUser.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新用户资料失败');
      }
      
      // 获取更新后的用户数据
      const updatedUser = await response.json();
      this.currentUser = updatedUser;
      
      return updatedUser;
    } catch (error) {
      console.error('更新用户资料失败:', error);
      throw error;
    }
  }

  /**
   * 发送密码重置邮件
   * @param email 用户邮箱
   */
  public async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to send password reset email');
      }

      console.log(`Better Auth sending password reset email to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    }
  }

  /**
   * 验证密码重置代码
   * @param code 重置代码
   * @returns 重置代码对应的邮箱地址
   */
  public async verifyPasswordResetCode(code: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/password/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error('Failed to verify password reset code');
      }

      const { email } = await response.json();
      return email;
    } catch (error) {
      console.error('Failed to verify password reset code:', error);
      throw error;
    }
  }

  /**
   * 确认密码重置
   * @param code 重置代码
   * @param newPassword 新密码
   */
  public async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/password/confirm-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ code, newPassword })
      });

      if (!response.ok) {
        throw new Error('Failed to confirm password reset');
      }

      console.log('Better Auth password reset confirmed');
    } catch (error) {
      console.error('Failed to confirm password reset:', error);
      throw error;
    }
  }

  /**
   * 发送邮箱验证邮件
   */
  public async sendEmailVerification(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user is signed in');
    }

    try {
      const response = await fetch(`${this.apiUrl}/auth/email/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send email verification');
      }

      console.log('Better Auth sending email verification');
    } catch (error) {
      console.error('Failed to send email verification:', error);
      throw error;
    }
  }

  /**
   * 应用邮箱验证代码
   * @param code 验证代码
   */
  public async applyActionCode(code: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error('Failed to apply action code');
      }

      console.log('Better Auth email verification applied');
    } catch (error) {
      console.error('Failed to apply action code:', error);
      throw error;
    }
  }

  /**
   * 更新用户邮箱
   * @param newEmail 新邮箱地址
   */
  public async updateEmail(newEmail: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user is signed in');
    }

    try {
      const response = await fetch(`${this.apiUrl}/auth/email/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ newEmail })
      });

      if (!response.ok) {
        throw new Error('Failed to update email');
      }

      // 更新数据库中的用户邮箱
      await this.db.getUserRepository().update(this.currentUser.id, { email: newEmail });
      this.currentUser.email = newEmail;

      console.log(`Better Auth email updated to: ${newEmail}`);
    } catch (error) {
      console.error('Failed to update email:', error);
      throw error;
    }
  }

  /**
   * 更新用户密码
   * @param newPassword 新密码
   */
  public async updatePassword(newPassword: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user is signed in');
    }

    try {
      const response = await fetch(`${this.apiUrl}/auth/password/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      console.log('Better Auth password updated');
    } catch (error) {
      console.error('Failed to update password:', error);
      throw error;
    }
  }
} 