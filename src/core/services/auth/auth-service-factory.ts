import { AuthProvider } from '@/core/services/auth/auth-types';
import { BetterAuthProvider } from './better-auth-provider';
import { FirebaseAuthProvider } from './firebase-auth-provider';
import { MockAuthProvider } from './mock-auth-provider';
import { logger } from '@/core/lib/logger';

export class AuthServiceFactory {
  private static instance: AuthServiceFactory;
  private currentProvider: AuthProvider;
  private forceProvider: AuthProvider | null = null;

  private constructor() {
    this.currentProvider = this.createProvider();
  }

  static getInstance(): AuthServiceFactory {
    if (!AuthServiceFactory.instance) {
      AuthServiceFactory.instance = new AuthServiceFactory();
    }
    return AuthServiceFactory.instance;
  }

  private async createProvider(): Promise<AuthProvider> {
    const env = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
    logger.info('创建认证提供者', { env });

    let provider: AuthProvider;
    switch (env) {
      case 'production':
        provider = FirebaseAuthProvider.getInstance();
        break;
      case 'local':
        provider = BetterAuthProvider.getInstance();
        break;
      case 'mock':
      default:
        provider = MockAuthProvider.getInstance();
        break;
    }

    try {
      await provider.initialize();
      logger.info('认证提供者初始化成功', { env });
    } catch (error) {
      logger.error('认证提供者初始化失败', { error });
      throw error;
    }

    return provider;
  }

  async getProvider(): Promise<AuthProvider> {
    if (this.forceProvider) {
      return this.forceProvider;
    }
    if (!this.currentProvider) {
      this.currentProvider = await this.createProvider();
    }
    return this.currentProvider;
  }

  setProvider(provider: AuthProvider): void {
    logger.info('强制设置认证提供者');
    this.forceProvider = provider;
  }

  async resetProvider(): Promise<void> {
    logger.info('重置认证提供者');
    this.forceProvider = null;
    this.currentProvider = await this.createProvider();
  }
} 