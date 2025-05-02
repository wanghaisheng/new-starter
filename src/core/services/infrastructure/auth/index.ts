// auth/index.ts
import type { IAuthService } from './types/auth-service';
import { AuthServiceFactory } from './factory/auth-service-factory';
import { AuthStrategy, AuthProvider } from '@/core/lib/db/types/common';
import { AuthServiceConfig, AuthServiceFactoryRegistry } from './factory/auth-service-factory';
import { getConfigService } from '@/core/services/infrastructure/config';
import { AUTH_KEYS } from '@/core/services/infrastructure/config/config-keys';
import { getLoggerService } from '@/core/services/infrastructure/logger';

const logger = getLoggerService();

let authService: IAuthService | undefined;

/**
 * 异步初始化认证服务
 * @param config 认证服务配置（可选）
 * @returns 初始化后的认证服务实例
 */
export async function initAuth(config?: Partial<AuthServiceConfig>): Promise<IAuthService> {
  try {
    // 如果未传入配置，从环境变量中获取
    if (!config) {
      const configService = getConfigService();
      logger.info('[AuthService] 从环境变量加载认证配置');
      
      // 记录认证策略和提供者
      const strategy = configService.get(AUTH_KEYS.NEXT_PUBLIC_AUTH_STRATEGY) as AuthStrategy | undefined;
      const provider = configService.get(AUTH_KEYS.NEXT_PUBLIC_AUTH_PROVIDER) as AuthProvider | undefined;
      logger.info('[AuthService] 认证策略:', strategy);
      logger.info('[AuthService] 认证提供者:', provider);
      
      config = {
        strategy: strategy || AuthStrategy.Mock,
        provider: provider || AuthProvider.Mock,
        options: {
          session: {
            duration: configService.get(AUTH_KEYS.NEXT_PUBLIC_SESSION_DURATION) || '1d',
            refresh: configService.get(AUTH_KEYS.NEXT_PUBLIC_SESSION_REFRESH) || '30m',
            cookie: {
              name: configService.get(AUTH_KEYS.NEXT_PUBLIC_SESSION_COOKIE_NAME) || 'auth_session',
              domain: configService.get(AUTH_KEYS.NEXT_PUBLIC_SESSION_COOKIE_DOMAIN) || '',
              secure: configService.get(AUTH_KEYS.NEXT_PUBLIC_SESSION_COOKIE_SECURE) || false
            }
          },
          token: {
            expiry: configService.get(AUTH_KEYS.NEXT_PUBLIC_TOKEN_EXPIRY) || '7d',
            refresh: configService.get(AUTH_KEYS.NEXT_PUBLIC_TOKEN_REFRESH) || '1d',
            algorithm: configService.get(AUTH_KEYS.NEXT_PUBLIC_TOKEN_ALGORITHM) || 'HS256',
            secret: configService.get(AUTH_KEYS.NEXT_PUBLIC_TOKEN_SECRET) || 'your-secret-key-here'
          },
          security: {
            rateLimit: configService.get(AUTH_KEYS.NEXT_PUBLIC_AUTH_RATE_LIMIT) || '100/hour',
            loginAttempts: configService.get(AUTH_KEYS.NEXT_PUBLIC_LOGIN_ATTEMPTS) || 5,
            lockoutDuration: configService.get(AUTH_KEYS.NEXT_PUBLIC_LOCKOUT_DURATION) || '15m',
            password: {
              minLength: configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_MIN_LENGTH) || 8,
              maxLength: configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_MAX_LENGTH) || 128,
              requireUppercase: configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE) || true,
              requireLowercase: configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_LOWERCASE) || true,
              requireNumber: configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBER) || true,
              requireSpecial: configService.get(AUTH_KEYS.NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL) || true
            }
          },
          socialLogin: {
            providers: (configService.get(AUTH_KEYS.NEXT_PUBLIC_SOCIAL_LOGIN_PROVIDERS) || '').split(','),
            google: {
              clientId: configService.get(AUTH_KEYS.NEXT_PUBLIC_GOOGLE_CLIENT_ID) || '',
              clientSecret: configService.get(AUTH_KEYS.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET) || ''
            },
            facebook: {
              appId: configService.get(AUTH_KEYS.NEXT_PUBLIC_FACEBOOK_APP_ID) || '',
              appSecret: configService.get(AUTH_KEYS.NEXT_PUBLIC_FACEBOOK_APP_SECRET) || ''
            },
            apple: {
              teamId: configService.get(AUTH_KEYS.NEXT_PUBLIC_APPLE_TEAM_ID) || '',
              keyId: configService.get(AUTH_KEYS.NEXT_PUBLIC_APPLE_KEY_ID) || '',
              privateKey: configService.get(AUTH_KEYS.NEXT_PUBLIC_APPLE_PRIVATE_KEY) || ''
            }
          }
        }
      };
    }

    try {
      // 确保配置存在且类型正确
      if (!config || !config.options) {
        throw new Error('[AuthService] 认证配置无效');
      }

      // 记录会话配置
      logger.info('[AuthService] 会话配置:', {
        duration: config.options.session.duration,
        refresh: config.options.session.refresh,
        cookieName: config.options.session.cookie.name
      });
      
      // 记录token配置
      logger.info('[AuthService] token配置:', {
        expiry: config.options.token.expiry,
        refresh: config.options.token.refresh,
        algorithm: config.options.token.algorithm
      });
      
      // 记录安全配置
      logger.info('[AuthService] 安全配置:', {
        rateLimit: config.options.security.rateLimit,
        loginAttempts: config.options.security.loginAttempts,
        lockoutDuration: config.options.security.lockoutDuration,
        password: {
          minLength: config.options.security.password.minLength,
          maxLength: config.options.security.password.maxLength,
          requirements: {
            requireUppercase: config.options.security.password.requireUppercase,
            requireLowercase: config.options.security.password.requireLowercase,
            requireNumber: config.options.security.password.requireNumber,
            requireSpecial: config.options.security.password.requireSpecial
          }
        }
      });
      
      // 记录社交登录配置
      logger.info('[AuthService] 社交登录配置:', {
        providers: config.options.socialLogin.providers,
        google: {
          hasConfig: !!config.options.socialLogin.google.clientId
        },
        facebook: {
          hasConfig: !!config.options.socialLogin.facebook.appId
        },
        apple: {
          hasConfig: !!config.options.socialLogin.apple.teamId
        }
      });
    } catch (error) {
      logger.error('[AuthService] 配置验证失败:', error);
      throw error;
    }
    }

    // 使用工厂的异步初始化方法
    logger.info('[AuthService] 开始初始化认证服务...');
    authService = await AuthServiceFactory.initService();
    logger.info('[AuthService] 认证服务初始化完成');
    
    // 配置认证服务
    const factoryConfig: Omit<AuthServiceConfig, 'environment' | 'name'> = {
      strategy: config.strategy!,
      provider: config.provider!,
      dataService: config.dataService,
      options: config.options
    };
    
    logger.info('[AuthService] 开始配置认证服务...');
    authService.configure(factoryConfig);
    logger.info('[AuthService] 认证服务配置完成');
    
    return authService;
  } catch (error) {
    logger.error('[AuthService] 认证服务初始化失败:', error);
    throw error;
  }
}

/**
 * 获取已初始化的认证服务
 * 若未初始化会抛出异常
 */
export function getAuthService(): IAuthService {
  if (!authService) {
    // 调试：打印调用栈和环境变量，定位谁在 initAuth 前调用
    console.error('[DEBUG] getAuthService called before initAuth');
    console.error(new Error('[DEBUG] getAuthService stack trace').stack);
    console.error('[DEBUG] process.env:', process.env);
    throw new Error('AuthService not initialized, call initAuth() first.');
  }
  return authService;
}

/**
 * （可选）测试环境重置，避免污染
 */
export function resetAuth() {
  // 清理认证服务实例
  authService = undefined;
  
  // 清理工厂的注册表
  AuthServiceFactoryRegistry.getInstance().clear();
}
