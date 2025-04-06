# 认证提供者适配指南

本指南详细介绍了如何为项目添加新的认证提供者，例如 NextAuth、Auth0 或其他第三方认证服务。

## 概述

项目的认证系统设计为可扩展的，允许轻松添加新的认证提供者。每个认证提供者都必须实现 `AuthProvider` 接口，并通过 `AuthServiceFactory` 进行注册。

## 认证提供者接口

所有认证提供者必须实现以下接口：

```typescript
export interface AuthProvider {
  // 初始化认证提供者
  initialize(): Promise<void>;
  
  // 邮箱登录
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  
  // 手机登录
  signInWithPhone(credentials: PhoneAuthCredentials): Promise<AuthUser>;
  
  // 发送手机验证码
  sendPhoneVerificationCode(phoneNumber: string): Promise<void>;
  
  // 社交账号登录
  signInWithSocial(credentials: SocialAuthCredentials): Promise<AuthUser>;
  
  // 登出
  signOut(): Promise<void>;
  
  // 获取当前用户
  getCurrentUser(): Promise<AuthUser | null>;
  
  // 刷新令牌
  refreshToken(): Promise<string>;
  
  // 重置密码
  resetPassword(email: string): Promise<void>;
  
  // 更新用户资料
  updateProfile(data: Partial<AuthUser>): Promise<AuthUser>;
  
  // 发送邮箱验证
  sendEmailVerification(): Promise<void>;
  
  // 验证邮箱
  verifyEmail(code: string): Promise<void>;
}
```

## 创建新的认证提供者

### 1. 创建提供者类

创建一个新的 TypeScript 文件，例如 `next-auth-provider.ts`：

```typescript
import { 
  AuthProvider, 
  AuthUser, 
  AuthError, 
  PhoneAuthCredentials, 
  SocialAuthCredentials 
} from '@/core/types/auth';
import { logger } from '@/core/lib/logger';

export class NextAuthProvider implements AuthProvider {
  private static instance: NextAuthProvider;
  private currentUser: AuthUser | null = null;
  
  private constructor() {
    // 私有构造函数，确保单例模式
  }
  
  static getInstance(): NextAuthProvider {
    if (!NextAuthProvider.instance) {
      NextAuthProvider.instance = new NextAuthProvider();
    }
    return NextAuthProvider.instance;
  }
  
  // 实现 AuthProvider 接口的所有方法
  async initialize(): Promise<void> {
    try {
      logger.info('初始化 NextAuth 认证');
      // 初始化 NextAuth 客户端
    } catch (error) {
      logger.error('初始化 NextAuth 认证失败', { error });
      throw new AuthError('初始化认证失败', 'INIT_ERROR', error);
    }
  }
  
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      logger.info('NextAuth 邮箱登录', { email });
      // 调用 NextAuth 的 signIn 方法
      // const result = await signIn('credentials', { email, password, redirect: false });
      
      // 转换为 AuthUser 格式
      const user: AuthUser = {
        id: 'user-id',
        email,
        displayName: 'User Name',
        emailVerified: false,
        phoneVerified: false,
        token: 'next-auth-token',
        refreshToken: 'next-auth-refresh-token',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        provider: 'email'
      };
      
      this.currentUser = user;
      return user;
    } catch (error) {
      logger.error('NextAuth 邮箱登录失败', { error, email });
      throw new AuthError('邮箱登录失败', 'EMAIL_SIGN_IN_ERROR', error);
    }
  }
  
  // 实现其他方法...
}
```

### 2. 更新 AuthServiceFactory

修改 `auth-service-factory.ts` 文件，添加新的认证提供者：

```typescript
import { AuthProvider } from '@/core/types/auth';
import { BetterAuthProvider } from './better-auth-provider';
import { FirebaseAuthProvider } from './firebase-auth-provider';
import { MockAuthProvider } from './mock-auth-provider';
import { NextAuthProvider } from './next-auth-provider'; // 导入新的提供者
import { logger } from '@/core/lib/logger';

export class AuthServiceFactory {
  // ...现有代码...
  
  private createProvider(): AuthProvider {
    const env = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
    logger.info('创建认证提供者', { env });
    
    switch (env) {
      case 'production':
        return FirebaseAuthProvider.getInstance();
      case 'local':
        return BetterAuthProvider.getInstance();
      case 'next-auth': // 添加新的环境选项
        return NextAuthProvider.getInstance();
      case 'mock':
      default:
        return MockAuthProvider.getInstance();
    }
  }
  
  // ...现有代码...
}
```

## 适配特定认证服务

### 适配 NextAuth.js

NextAuth.js 是一个流行的认证库，以下是适配示例：

```typescript
import { 
  AuthProvider, 
  AuthUser, 
  AuthError, 
  PhoneAuthCredentials, 
  SocialAuthCredentials 
} from '@/core/types/auth';
import { logger } from '@/core/lib/logger';
import { signIn, signOut, getSession, getProviders } from 'next-auth/react';

export class NextAuthProvider implements AuthProvider {
  private static instance: NextAuthProvider;
  private currentUser: AuthUser | null = null;
  
  private constructor() {
    // 私有构造函数，确保单例模式
  }
  
  static getInstance(): NextAuthProvider {
    if (!NextAuthProvider.instance) {
      NextAuthProvider.instance = new NextAuthProvider();
    }
    return NextAuthProvider.instance;
  }
  
  async initialize(): Promise<void> {
    try {
      logger.info('初始化 NextAuth 认证');
      const session = await getSession();
      if (session?.user) {
        this.currentUser = this.convertNextAuthUser(session.user);
      }
    } catch (error) {
      logger.error('初始化 NextAuth 认证失败', { error });
      throw new AuthError('初始化认证失败', 'INIT_ERROR', error);
    }
  }
  
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      logger.info('NextAuth 邮箱登录', { email });
      const result = await signIn('credentials', { 
        email, 
        password, 
        redirect: false 
      });
      
      if (result?.error) {
        throw new AuthError('邮箱登录失败', 'EMAIL_SIGN_IN_ERROR', result.error);
      }
      
      const session = await getSession();
      if (!session?.user) {
        throw new AuthError('获取用户会话失败', 'SESSION_ERROR');
      }
      
      this.currentUser = this.convertNextAuthUser(session.user);
      return this.currentUser;
    } catch (error) {
      logger.error('NextAuth 邮箱登录失败', { error, email });
      throw new AuthError('邮箱登录失败', 'EMAIL_SIGN_IN_ERROR', error);
    }
  }
  
  async signInWithSocial(credentials: SocialAuthCredentials): Promise<AuthUser> {
    try {
      logger.info('NextAuth 社交账号登录', { provider: credentials.provider });
      const result = await signIn(credentials.provider, { 
        token: credentials.token,
        redirect: false 
      });
      
      if (result?.error) {
        throw new AuthError('社交账号登录失败', 'SOCIAL_SIGN_IN_ERROR', result.error);
      }
      
      const session = await getSession();
      if (!session?.user) {
        throw new AuthError('获取用户会话失败', 'SESSION_ERROR');
      }
      
      this.currentUser = this.convertNextAuthUser(session.user);
      return this.currentUser;
    } catch (error) {
      logger.error('NextAuth 社交账号登录失败', { error, provider: credentials.provider });
      throw new AuthError('社交账号登录失败', 'SOCIAL_SIGN_IN_ERROR', error);
    }
  }
  
  async signOut(): Promise<void> {
    try {
      logger.info('NextAuth 用户登出');
      await signOut();
      this.currentUser = null;
    } catch (error) {
      logger.error('NextAuth 用户登出失败', { error });
      throw new AuthError('登出失败', 'SIGN_OUT_ERROR', error);
    }
  }
  
  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    try {
      const session = await getSession();
      if (session?.user) {
        this.currentUser = this.convertNextAuthUser(session.user);
        return this.currentUser;
      }
      return null;
    } catch (error) {
      logger.error('获取 NextAuth 当前用户失败', { error });
      return null;
    }
  }
  
  // 实现其他方法...
  
  private convertNextAuthUser(user: any): AuthUser {
    return {
      id: user.id || user.sub || 'unknown',
      email: user.email || '',
      displayName: user.name || '',
      photoURL: user.image || undefined,
      emailVerified: user.emailVerified || false,
      phoneVerified: false,
      token: user.accessToken || '',
      refreshToken: user.refreshToken || '',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      provider: this.getProviderType(user)
    };
  }
  
  private getProviderType(user: any): 'email' | 'phone' | 'google' | 'facebook' | 'apple' {
    if (user.provider) {
      switch (user.provider) {
        case 'google':
          return 'google';
        case 'facebook':
          return 'facebook';
        case 'apple':
          return 'apple';
        case 'credentials':
          return 'email';
        default:
          return 'email';
      }
    }
    return 'email';
  }
}
```

### 适配 Auth0

Auth0 是另一个流行的认证服务，以下是适配示例：

```typescript
import { 
  AuthProvider, 
  AuthUser, 
  AuthError, 
  PhoneAuthCredentials, 
  SocialAuthCredentials 
} from '@/core/types/auth';
import { logger } from '@/core/lib/logger';
import { Auth0Client } from '@auth0/auth0-spa-js';

export class Auth0Provider implements AuthProvider {
  private static instance: Auth0Provider;
  private currentUser: AuthUser | null = null;
  private auth0Client: Auth0Client;
  
  private constructor() {
    this.auth0Client = new Auth0Client({
      domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '',
      clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '',
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    });
  }
  
  static getInstance(): Auth0Provider {
    if (!Auth0Provider.instance) {
      Auth0Provider.instance = new Auth0Provider();
    }
    return Auth0Provider.instance;
  }
  
  async initialize(): Promise<void> {
    try {
      logger.info('初始化 Auth0 认证');
      const isAuthenticated = await this.auth0Client.isAuthenticated();
      if (isAuthenticated) {
        const user = await this.auth0Client.getUser();
        if (user) {
          this.currentUser = this.convertAuth0User(user);
        }
      }
    } catch (error) {
      logger.error('初始化 Auth0 认证失败', { error });
      throw new AuthError('初始化认证失败', 'INIT_ERROR', error);
    }
  }
  
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      logger.info('Auth0 邮箱登录', { email });
      await this.auth0Client.loginWithRedirect({
        authorizationParams: {
          username: email,
          password: password,
          realm: 'Username-Password-Authentication'
        }
      });
      
      // 注意：由于重定向，此方法可能不会立即返回
      // 实际应用中，登录成功后会重定向回应用
      throw new AuthError('重定向登录', 'REDIRECT_REQUIRED');
    } catch (error) {
      logger.error('Auth0 邮箱登录失败', { error, email });
      throw new AuthError('邮箱登录失败', 'EMAIL_SIGN_IN_ERROR', error);
    }
  }
  
  async signInWithSocial(credentials: SocialAuthCredentials): Promise<AuthUser> {
    try {
      logger.info('Auth0 社交账号登录', { provider: credentials.provider });
      await this.auth0Client.loginWithRedirect({
        authorizationParams: {
          connection: credentials.provider
        }
      });
      
      // 注意：由于重定向，此方法可能不会立即返回
      throw new AuthError('重定向登录', 'REDIRECT_REQUIRED');
    } catch (error) {
      logger.error('Auth0 社交账号登录失败', { error, provider: credentials.provider });
      throw new AuthError('社交账号登录失败', 'SOCIAL_SIGN_IN_ERROR', error);
    }
  }
  
  async signOut(): Promise<void> {
    try {
      logger.info('Auth0 用户登出');
      await this.auth0Client.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
      this.currentUser = null;
    } catch (error) {
      logger.error('Auth0 用户登出失败', { error });
      throw new AuthError('登出失败', 'SIGN_OUT_ERROR', error);
    }
  }
  
  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    try {
      const isAuthenticated = await this.auth0Client.isAuthenticated();
      if (isAuthenticated) {
        const user = await this.auth0Client.getUser();
        if (user) {
          this.currentUser = this.convertAuth0User(user);
          return this.currentUser;
        }
      }
      return null;
    } catch (error) {
      logger.error('获取 Auth0 当前用户失败', { error });
      return null;
    }
  }
  
  // 实现其他方法...
  
  private convertAuth0User(user: any): AuthUser {
    return {
      id: user.sub || 'unknown',
      email: user.email || '',
      displayName: user.name || '',
      photoURL: user.picture || undefined,
      emailVerified: user.email_verified || false,
      phoneVerified: user.phone_number_verified || false,
      token: user.access_token || '',
      refreshToken: user.refresh_token || '',
      createdAt: new Date(user.updated_at || Date.now()),
      lastLoginAt: new Date(),
      provider: this.getProviderType(user)
    };
  }
  
  private getProviderType(user: any): 'email' | 'phone' | 'google' | 'facebook' | 'apple' {
    if (user.identities && user.identities.length > 0) {
      const provider = user.identities[0].provider;
      switch (provider) {
        case 'google-oauth2':
          return 'google';
        case 'facebook':
          return 'facebook';
        case 'apple':
          return 'apple';
        case 'auth0':
          return 'email';
        default:
          return 'email';
      }
    }
    return 'email';
  }
}
```

## 处理特殊认证流程

### 处理 OAuth 重定向

某些认证服务（如 Auth0）使用重定向流程进行认证。在这种情况下，需要特殊处理：

```typescript
// 在应用初始化时检查重定向
async function handleRedirectCallback() {
  try {
    // 检查是否是从认证服务重定向回来的
    if (window.location.search.includes('code=')) {
      // 处理重定向回调
      await auth0Client.handleRedirectCallback();
      
      // 获取用户信息
      const user = await auth0Client.getUser();
      if (user) {
        // 更新当前用户
        authService.setCurrentUser(convertAuth0User(user));
      }
      
      // 清除 URL 中的查询参数
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (error) {
    console.error('处理重定向回调失败', error);
  }
}
```

### 处理手机验证

手机验证通常需要特殊处理，例如使用 reCAPTCHA：

```typescript
async sendPhoneVerificationCode(phoneNumber: string): Promise<void> {
  try {
    logger.info('发送手机验证码', { phoneNumber });
    
    // 创建 reCAPTCHA 验证器
    const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA 验证成功
      }
    }, auth);
    
    // 发送验证码
    await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  } catch (error) {
    logger.error('发送手机验证码失败', { error, phoneNumber });
    throw new AuthError('发送验证码失败', 'SEND_CODE_ERROR', error);
  }
}
```

## 测试新的认证提供者

创建新的认证提供者后，应该编写测试以确保其正确实现：

```typescript
// test/services/auth/next-auth-provider.test.ts
import { NextAuthProvider } from '@/core/services/auth/next-auth-provider';
import { AuthError } from '@/core/types/auth';

// 模拟 NextAuth 函数
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  getProviders: jest.fn()
}));

describe('NextAuthProvider', () => {
  let provider: NextAuthProvider;
  
  beforeEach(() => {
    provider = NextAuthProvider.getInstance();
    jest.clearAllMocks();
  });
  
  describe('signInWithEmail', () => {
    it('should sign in with email and password', async () => {
      // 设置模拟返回值
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      (getSession as jest.Mock).mockResolvedValue({ user: mockUser });
      
      // 调用方法
      const user = await provider.signInWithEmail('test@example.com', 'password');
      
      // 验证结果
      expect(user.email).toBe('test@example.com');
      expect(user.displayName).toBe('Test User');
    });
    
    it('should handle sign in errors', async () => {
      // 设置模拟错误
      (signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' });
      
      // 验证错误处理
      await expect(provider.signInWithEmail('test@example.com', 'wrong-password'))
        .rejects
        .toThrow(AuthError);
    });
  });
  
  // 其他测试...
});
```

## 最佳实践

1. **保持一致性**：确保所有认证提供者实现相同的接口
2. **错误处理**：使用统一的错误处理机制
3. **日志记录**：记录所有认证操作和错误
4. **类型安全**：使用 TypeScript 类型确保类型安全
5. **测试覆盖**：为新的认证提供者编写全面的测试
6. **文档化**：记录新的认证提供者的配置和使用方法

## 配置示例

### NextAuth.js 配置

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 验证用户凭据
        // 返回用户对象或 null
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },
  },
});
```

### Auth0 配置

```typescript
// 环境变量
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-client-id
```

## 总结

通过实现 `AuthProvider` 接口，可以轻松地将新的认证服务集成到项目中。这种设计允许在不修改现有代码的情况下添加新的认证提供者，同时保持一致的 API 和错误处理机制。 