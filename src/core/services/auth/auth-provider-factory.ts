import { AuthProvider } from './auth-provider';
import { UnifiedAuthProvider, UnifiedAuthProviderConfig } from './unified-auth-provider';
import { AuthDataSource, MockAuthDataSource, LocalAuthDataSource, CloudAuthDataSource } from './data-source';
import { Logger } from '@/core/lib/utils/logger';

const logger = new Logger('AuthProviderFactory');

/**
 * Environment types supported by the application
 */
export type Environment = 'mock' | 'dev' | 'prod';

/**
 * Factory for creating auth providers
 * This factory creates the appropriate auth provider based on the environment
 */
export class AuthProviderFactory {
  private static instance: AuthProvider | null = null;
  
  /**
   * Get the auth provider for the current environment
   * @param env The environment to get the auth provider for
   * @returns The auth provider for the specified environment
   */
  static getAuthProvider(env: Environment = 'mock'): AuthProvider {
    if (this.instance) {
      return this.instance;
    }
    
    logger.info('Creating auth provider for environment', { env });
    
    const dataSource = this.createDataSource(env);
    const config: UnifiedAuthProviderConfig = { dataSource };
    
    this.instance = new UnifiedAuthProvider(config);
    logger.info('Auth provider created successfully', { env });
    
    return this.instance;
  }
  
  /**
   * Create the appropriate data source based on the environment
   * @param env The environment to create the data source for
   * @returns The data source for the specified environment
   */
  private static createDataSource(env: Environment): AuthDataSource {
    switch (env) {
      case 'mock':
        logger.info('Creating mock auth data source');
        return new MockAuthDataSource();
      case 'dev':
        logger.info('Creating local auth data source');
        return new LocalAuthDataSource();
      case 'prod':
        logger.info('Creating cloud auth data source');
        return new CloudAuthDataSource();
      default:
        logger.warn('Unknown environment, defaulting to mock auth data source', { env });
        return new MockAuthDataSource();
    }
  }
  
  /**
   * Reset the auth provider instance
   * This is useful for testing or when you need to create a new instance
   */
  static reset(): void {
    this.instance = null;
    logger.info('Auth provider instance reset');
  }
} 