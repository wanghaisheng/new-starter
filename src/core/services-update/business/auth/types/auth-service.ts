// 认证服务接口定义
export interface IAuthService {
  initialize(): Promise<void>;
  loginWithEmail(email: string, password: string): Promise<AuthResult>;
  loginWithPhone(phone: string, code: string): Promise<AuthResult>;
  loginWithProvider(provider: 'google' | 'apple' | 'wechat', token: string): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  refreshToken(): Promise<string>;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  provider?: string;
  [key: string]: any;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
  expiresIn?: number;
  [key: string]: any;
}
