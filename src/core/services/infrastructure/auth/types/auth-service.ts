import { AuthStrategy } from '@/core/lib/db/types/common';

// 认证服务接口定义（所有适配器必须实现）
export interface IAuthService {
  /** 初始化服务（如远程SDK、缓存等） */
  initialize(): Promise<void>;
  /** 配置认证服务 */
  configure(config: {
    strategy: AuthStrategy;
    dataService?: any;
    options?: { [key: string]: any }
  }): void;
  /** 邮箱登录 */
  loginWithEmail(email: string, password: string): Promise<AuthResult>;
  /** 手机号登录 */
  loginWithPhone(phone: string, code: string): Promise<AuthResult>;
  /** 第三方登录（如微信/Google/Apple） */
  loginWithProvider(provider: 'google'|'apple'|'wechat', token: string): Promise<AuthResult>;
  /** 注销登录 */
  logout(): Promise<void>;
  /** 获取当前用户 */
  getCurrentUser(): Promise<AuthUser | null>;
  /** 刷新token */
  refreshToken(): Promise<string>;
}

// 认证适配器接口定义（便于插件式注册、扩展）
export interface IAuthAdapter extends IAuthService {
  // 可扩展适配器独有的初始化/配置方法
  setConfig?(config: Record<string, any>): void;
}

// 用户信息结构体
export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  provider?: string;
  [key: string]: any;
}

// 登录/注册结果
export interface AuthResult {
  user: AuthUser;
  token: string;
  expiresIn?: number;
  [key: string]: any;
}

// 错误类型
export interface AuthError {
  code: string;
  message: string;
  [key: string]: any;
}

// 会话类型
export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: Date;
  [key: string]: any;
}
