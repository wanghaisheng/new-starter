console.log('[DEBUG][mock-auth-service] 文件被加载');

// mock 认证服务适配器，便于本地开发与单元测试
import { IAuthAdapter, AuthUser, AuthResult } from '../../types/auth-service';
import { AuthStrategy } from '@/core/lib/db/types/common';

export class MockAuthService implements IAuthAdapter {
  private user: AuthUser | null = null;
  private strategy: AuthStrategy = AuthStrategy.Mock;
  private dataService: any;
  private options: { [key: string]: any } = {};

  /**
   * 配置认证服务
   */
  configure(config: {
    strategy: AuthStrategy;
    dataService?: any;
    options?: { [key: string]: any }
  }) {
    this.strategy = config.strategy;
    this.dataService = config.dataService;
    this.options = config.options || {};
  }

  /**
   * 初始化 mock 认证服务
   * mock: 不进行任何操作
   */
  async initialize() { /* mock: do nothing */ }
  /**
   * 使用邮箱登录
   * mock: 返回固定用户信息和 token
   * @param email 邮箱地址
   * @param password 密码（未使用）
   * @returns AuthResult
   */
  async loginWithEmail(email: string, password: string): Promise<AuthResult> {
    this.user = { id: 'mock', email, displayName: 'Mock User' };
    return { user: this.user, token: 'mock-token' };
  }
  /**
   * 使用手机号登录
   * mock: 返回固定用户信息和 token
   * @param phone 手机号
   * @param code 验证码（未使用）
   * @returns AuthResult
   */
  async loginWithPhone(phone: string, code: string): Promise<AuthResult> {
    this.user = { id: 'mock', phone, displayName: 'Mock User' };
    return { user: this.user, token: 'mock-token' };
  }
  /**
   * 使用第三方登录
   * mock: 返回固定用户信息和 token
   * @param provider 第三方登录提供商（google、apple、wechat）
   * @param token 第三方登录 token
   * @returns AuthResult
   */
  async loginWithProvider(provider: 'google'|'apple'|'wechat', token: string): Promise<AuthResult> {
    this.user = { id: 'mock', provider, displayName: 'Mock User' };
    return { user: this.user, token: 'mock-token' };
  }
  /**
   * 退出登录
   * mock: 清空用户信息
   */
  async logout(): Promise<void> { this.user = null; }
  /**
   * 获取当前登录用户信息
   * mock: 返回固定用户信息
   * @returns AuthUser|null
   */
  async getCurrentUser(): Promise<AuthUser | null> { return this.user; }
  /**
   * 刷新 token
   * mock: 返回固定 token
   * @returns string
   */
  async refreshToken(): Promise<string> { return 'mock-token'; }
  setConfig?(config: Record<string, any>) {/* 可选扩展 */}
}
