import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/core/services/auth/auth-service';
import { AuthError } from '@/core/services/auth/auth-error';
import { Logger } from '@/core/lib/utils/logger';

const logger = new Logger('AuthLoginAPI');

/**
 * POST /api/mobile/v1/auth/login
 * Login with email and password
 */
export async function POST(req: NextRequest) {
  try {
    logger.info('Login request received');
    
    // Parse request body
    const body = await req.json();
    const { email, password } = body;
    
    // Validate request body
    if (!email || !password) {
      logger.warn('Missing email or password');
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }
    
    // Get auth service
    const authService = new AuthService();
    
    // Sign in with email and password
    const session = await authService.signInWithEmail(email, password);
    
    logger.info('User logged in successfully', { userId: session.user.id });
    
    // Return session data
    return NextResponse.json({
      success: true,
      data: {
        user: session.user,
        token: session.token
      }
    });
  } catch (error) {
    logger.error('Login failed', { error });
    
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
} 