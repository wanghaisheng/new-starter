import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/core/services/auth/auth-service';
import { AuthError } from '@/core/services/auth/auth-error';
import { AuthProviderType } from '@/core/services/auth/auth-provider';
import { Logger } from '@/core/lib/utils/logger';

const logger = new Logger('AuthProviderAPI');

/**
 * POST /api/mobile/v1/auth/provider
 * Login with a third-party provider
 */
export async function POST(req: NextRequest) {
  try {
    logger.info('Provider login request received');
    
    // Parse request body
    const body = await req.json();
    const { provider } = body;
    
    // Validate request body
    if (!provider) {
      logger.warn('Missing provider');
      return NextResponse.json(
        { error: '提供商不能为空' },
        { status: 400 }
      );
    }
    
    // Validate provider type
    const validProviders: AuthProviderType[] = ['google', 'facebook', 'apple'];
    if (!validProviders.includes(provider)) {
      logger.warn('Invalid provider', { provider });
      return NextResponse.json(
        { error: '不支持的提供商' },
        { status: 400 }
      );
    }
    
    // Get auth service
    const authService = new AuthService();
    
    // Sign in with provider
    const user = await authService.signInWithProvider(provider);
    
    logger.info('User logged in with provider successfully', { userId: user.id, provider });
    
    // Return user data
    return NextResponse.json({
      user,
      token: 'mock-token-' + Date.now(), // In a real app, this would be a JWT
    });
  } catch (error) {
    logger.error('Provider login failed', { error });
    
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
} 