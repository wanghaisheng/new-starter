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

  private createProvider(): AuthProvider {
    const env = process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
    logger.info('创建认证提供者', { env });

    switch (env) {
      case 'production':
        return FirebaseAuthProvider.getInstance();
      case 'local':
        return BetterAuthProvider.getInstance();
      case 'mock':
      default:
        return MockAuthProvider.getInstance();
    }
  }

  getProvider(): AuthProvider {
    if (this.forceProvider) {
      return this.forceProvider;
    }
    return this.currentProvider;
  }

  setProvider(provider: AuthProvider): void {
    logger.info('强制设置认证提供者');
    this.forceProvider = provider;
  }

  resetProvider(): void {
    logger.info('重置认证提供者');
    this.forceProvider = null;
    this.currentProvider = this.createProvider();
  }
} 