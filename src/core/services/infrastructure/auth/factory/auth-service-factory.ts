// 认证服务工厂，统一为 class + static createService 方法
import { IAuthService } from '../types/auth-service';
import { MockAuthService } from '../adapters/mock/mock-auth-service';
import { HybridAuthService } from '../adapters/hybrid-auth-service';
import { PersistentMockAuthService } from '../adapters/mock/persistent-mock-auth-service';
import { getConfigService } from '@/core/services/infrastructure/config';
import { AuthStrategy, AuthProvider } from '@/core/lib/db/types/common';
import { AUTH_KEYS } from '@/core/services/infrastructure/config/config-keys';

// 默认认证配置
const DEFAULT_AUTH_CONFIG: AuthServiceConfig = {
  environment: 'mock',
  name: 'default-auth',
  strategy: AuthStrategy.Mock,
  provider: AuthProvider.Mock,
  options: {
    session: {
      duration: '1d',
      refresh: '30m',
      cookie: {
        name: 'auth_session',
        domain: '',
        secure: false
      }
    },
    token: {
      expiry: '7d',
      refresh: '1d',
      algorithm: 'HS256',
      secret: 'your-secret-key-here'
    },
    security: {
      rateLimit: '100/hour',
      loginAttempts: 5,
      lockoutDuration: '15m',
      password: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true
      }
    },
    socialLogin: {
      providers: [],
      google: {
        clientId: '',
        clientSecret: ''
      },
      facebook: {
        appId: '',
        appSecret: ''
      },
      apple: {
        teamId: '',
        keyId: '',
        privateKey: ''
      }
    }
  }
};

// 自动根据环境变量决定默认类型
async function resolveAuthConfig(): Promise<AuthServiceConfig> {
  let configService: any;
  try {
    configService = getConfigService();
  } catch (e) {
    console.warn('[AuthService] 配置服务未初始化，使用默认认证配置');
    return DEFAULT_AUTH_CONFIG;
  }

  const config: AuthServiceConfig = { ...DEFAULT_AUTH_CONFIG };

  // 解析环境变量
  config.environment = configService.get('NODE_ENV') || 'mock';
  config.strategy = configService.get(AUTH_KEYS.NEXT_PUBLIC_AUTH_STRATEGY) as AuthStrategy || AuthStrategy.Mock;
  config.provider = configService.get(AUTH_KEYS.NEXT_PUBLIC_AUTH_PROVIDER) as AuthProvider || AuthProvider.Mock;

  // 确保 options 存在
  if (!config.options) {
    config.options = {};
  }

  // 解析会话配置
  if (!config.options.session) {
    config.options.session = {};
  }
  if (!config.options.session.cookie) {
    config.options.session.cookie = {};
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_SESSION_DURATION)) {
    config.options.session.duration = configService.get(AUTH_KEYS.NEXT_PUBLIC_SESSION_DURATION);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_SESSION_REFRESH)) {
    config.options.session.refresh = configService.get(AUTH_KEYS.NEXT_PUBLIC_SESSION_REFRESH);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_SESSION_COOKIE_NAME)) {
    config.options.session.cookie.name = configService.get(AUTH_KEYS.NEXT_PUBLIC_SESSION_COOKIE_NAME);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_SESSION_COOKIE_DOMAIN)) {
    config.options.session.cookie.domain = configService.get(AUTH_KEYS.NEXT_PUBLIC_SESSION_COOKIE_DOMAIN);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_SESSION_COOKIE_SECURE)) {
    config.options.session.cookie.secure = configService.get(AUTH_KEYS.NEXT_PUBLIC_SESSION_COOKIE_SECURE);
  }

  // 解析 token 配置
  if (!config.options.token) {
    config.options.token = {};
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_TOKEN_EXPIRY)) {
    config.options.token.expiry = configService.get(AUTH_KEYS.NEXT_PUBLIC_TOKEN_EXPIRY);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_TOKEN_REFRESH)) {
    config.options.token.refresh = configService.get(AUTH_KEYS.NEXT_PUBLIC_TOKEN_REFRESH);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_TOKEN_ALGORITHM)) {
    config.options.token.algorithm = configService.get(AUTH_KEYS.NEXT_PUBLIC_TOKEN_ALGORITHM);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_TOKEN_SECRET)) {
    config.options.token.secret = configService.get(AUTH_KEYS.NEXT_PUBLIC_TOKEN_SECRET);
  }

  // 解析安全配置
  if (!config.options.security) {
    config.options.security = {};
  }
  if (!config.options.security.password) {
    config.options.security.password = {};
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_AUTH_RATE_LIMIT)) {
    config.options.security.rateLimit = configService.get(AUTH_KEYS.NEXT_PUBLIC_AUTH_RATE_LIMIT);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_LOGIN_ATTEMPTS)) {
    config.options.security.loginAttempts = configService.get(AUTH_KEYS.NEXT_PUBLIC_LOGIN_ATTEMPTS);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_LOCKOUT_DURATION)) {
    config.options.security.lockoutDuration = configService.get(AUTH_KEYS.NEXT_PUBLIC_LOCKOUT_DURATION);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_MIN_LENGTH)) {
    config.options.security.password.minLength = configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_MIN_LENGTH);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_MAX_LENGTH)) {
    config.options.security.password.maxLength = configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_MAX_LENGTH);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE)) {
    config.options.security.password.requireUppercase = configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_LOWERCASE)) {
    config.options.security.password.requireLowercase = configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_LOWERCASE);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBER)) {
    config.options.security.password.requireNumber = configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBER);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL)) {
    config.options.security.password.requireSpecial = configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL);
  }

  // 解析社交登录配置
  if (!config.options.socialLogin) {
    config.options.socialLogin = {};
  }
  if (!config.options.socialLogin.google) {
    config.options.socialLogin.google = {};
  }
  if (!config.options.socialLogin.facebook) {
    config.options.socialLogin.facebook = {};
  }
  if (!config.options.socialLogin.apple) {
    config.options.socialLogin.apple = {};
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_SOCIAL_LOGIN_PROVIDERS)) {
    config.options.socialLogin.providers = configService.get(AUTH_KEYS.NEXT_PUBLIC_SOCIAL_LOGIN_PROVIDERS).split(',');
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_GOOGLE_CLIENT_ID)) {
    config.options.socialLogin.google.clientId = configService.get(AUTH_KEYS.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET)) {
    config.options.socialLogin.google.clientSecret = configService.get(AUTH_KEYS.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_FACEBOOK_APP_ID)) {
    config.options.socialLogin.facebook.appId = configService.get(AUTH_KEYS.NEXT_PUBLIC_FACEBOOK_APP_ID);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_FACEBOOK_APP_SECRET)) {
    config.options.socialLogin.facebook.appSecret = configService.get(AUTH_KEYS.NEXT_PUBLIC_FACEBOOK_APP_SECRET);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_APPLE_TEAM_ID)) {
    config.options.socialLogin.apple.teamId = configService.get(AUTH_KEYS.NEXT_PUBLIC_APPLE_TEAM_ID);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_APPLE_KEY_ID)) {
    config.options.socialLogin.apple.keyId = configService.get(AUTH_KEYS.NEXT_PUBLIC_APPLE_KEY_ID);
  }
  if (configService.has(AUTH_KEYS.NEXT_PUBLIC_APPLE_PRIVATE_KEY)) {
    config.options.socialLogin.apple.privateKey = configService.get(AUTH_KEYS.NEXT_PUBLIC_APPLE_PRIVATE_KEY);
  }

  return config;
}

export class AuthServiceFactory {
  static async initService(): Promise<IAuthService> {
    const config = await resolveAuthConfig();
    return this.createService(config);
  }

  static createService(config: AuthServiceConfig): IAuthService {
    const resolvedStrategy = config.strategy;
    const resolvedProvider = config.provider;
    
    console.log('[DEBUG][auth-service-factory] 创建 auth 策略/提供者:', resolvedStrategy, resolvedProvider);

    // 根据 provider 选择对应的适配器
    let adapter: IAuthService;
    switch(resolvedProvider) {
      case AuthProvider.Mock:
        adapter = new MockAuthService();
        break;
      case AuthProvider.PersistentMock:
        adapter = new PersistentMockAuthService();
        break;
      case AuthProvider.Firebase:
        // 动态 require，避免 mock 环境下 firebase-adapter 被静态 import
        const { FirebaseAuthAdapter } = require('../adapters/firebase/firebase-auth-service');
        adapter = new FirebaseAuthAdapter();
        break;
      case AuthProvider.Better:
        // 动态 require，避免 mock 环境下 better-auth-adapter 被静态 import
        const { BetterAuthService } = require('../adapters/better/better-auth-service');
        adapter = new BetterAuthService();
        break;
      case AuthProvider.Hybrid:
        adapter = new HybridAuthService();
        break;
      default:
        throw new Error(`Unsupported auth provider: ${resolvedProvider}`);
    }

    // 配置适配器
    adapter.configure({
      strategy: resolvedStrategy,
      dataService: config.dataService,
      options: config.options || {}
    });

    return adapter;
  }

  static getConfigService(): any {
    return getConfigService();
  }
}

export class AuthServiceConfig {
  environment: 'production'|'test'|'mock';
  name: string;
  strategy: AuthStrategy;
  provider: AuthProvider;
  dataService?: any;
  options?: { [key: string]: any };
}

export class AuthServiceFactoryRegistry {
  private static instance: AuthServiceFactoryRegistry;
  private registry: Record<string, IAuthService> = {};

  static getInstance(): AuthServiceFactoryRegistry {
    if (!this.instance) this.instance = new AuthServiceFactoryRegistry();
    return this.instance;
  }

  createService(config: AuthServiceConfig): IAuthService {
    const key = `${config.strategy}:${config.name}`;
    if (this.registry[key]) return this.registry[key];
    const service = AuthServiceFactory.createService(config);
    this.registry[key] = service;
    return service;
  }

  getService(strategy: AuthStrategy, name: string): IAuthService | undefined {
    return this.registry[`${strategy}:${name}`];
  }

  clear(): void {
    this.registry = {};
  }
}
