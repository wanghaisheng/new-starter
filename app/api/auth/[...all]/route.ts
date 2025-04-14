import { NextRequest, NextResponse } from 'next/server';
import { AuthServiceFactory } from '@/core/services/auth/auth-service-factory';
import { AuthProviderType, AuthError, AuthSession } from '@/core/services/auth/auth-types';
import { getAuthConfig, isAuthMethodEnabled } from '@/core/services/auth/auth-config';
import { logger } from '@/core/lib/logger';

// Helper function to create error response
const createErrorResponse = (error: any, status: number = 400) => {
  if (error instanceof AuthError) {
    logger.error('Auth error:', { code: error.code, message: error.message });
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status }
    );
  }
  logger.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
};

// Helper function to create success response
const createSuccessResponse = (data: any) => {
  return NextResponse.json({ success: true, data });
};

// 处理认证请求
export async function POST(request: NextRequest) {
  try {
    const authProvider = AuthServiceFactory.getInstance().getProvider();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const provider = searchParams.get('provider') as AuthProviderType | null;

    // 验证请求体
    const body = await request.json();

    switch (action) {
      case 'login': {
        if (!provider) {
          return createErrorResponse(new AuthError('Provider is required', 'INVALID_PROVIDER'));
        }

        if (!isAuthMethodEnabled(provider)) {
          return createErrorResponse(
            new AuthError(`Authentication method ${provider} is not enabled`, 'PROVIDER_NOT_ENABLED')
          );
        }

        let session: AuthSession;

        switch (provider) {
          case 'emailAndPassword': {
            const { email, password } = body;
            if (!email || !password) {
              return createErrorResponse(
                new AuthError('Email and password are required', 'INVALID_CREDENTIALS')
              );
            }
            session = await authProvider.signInWithEmail(email, password);
            break;
          }

          case 'phone': {
            const { phoneNumber, verificationCode } = body;
            if (!phoneNumber || !verificationCode) {
              return createErrorResponse(
                new AuthError('Phone number and verification code are required', 'INVALID_CREDENTIALS')
              );
            }
            session = await authProvider.signInWithPhone({ phoneNumber, verificationCode });
            break;
          }

          case 'google':
          case 'facebook':
          case 'apple': {
            const { token: socialToken } = body;
            if (!socialToken) {
              return createErrorResponse(
                new AuthError('Social token is required', 'INVALID_CREDENTIALS')
              );
            }
            session = await authProvider.signInWithProvider(provider);
            break;
          }

          default:
            return createErrorResponse(
              new AuthError('Invalid provider', 'INVALID_PROVIDER')
            );
        }

        // Set auth token in cookie
        const response = createSuccessResponse({ 
          user: session.user,
          token: session.token,
          expiresAt: session.expiresAt
        });
        response.cookies.set('auth_token', session.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        return response;
      }

      case 'register': {
        const { email, password, ...userData } = body;
        if (!email || !password) {
          return createErrorResponse(
            new AuthError('Email and password are required', 'INVALID_CREDENTIALS')
          );
        }
        const newUser = await authProvider.createUser({ email, password, ...userData });
        return createSuccessResponse({ user: newUser });
      }

      case 'verify-email': {
        const { code } = body;
        if (!code) {
          return createErrorResponse(
            new AuthError('Verification code is required', 'INVALID_CODE')
          );
        }
        await authProvider.verifyEmail(code);
        return createSuccessResponse({ message: 'Email verified successfully' });
      }

      case 'reset-password': {
        const { email: resetEmail } = body;
        if (!resetEmail) {
          return createErrorResponse(
            new AuthError('Email is required', 'INVALID_EMAIL')
          );
        }
        await authProvider.resetPassword(resetEmail);
        return createSuccessResponse({ message: 'Password reset email sent' });
      }

      case 'send-verification-code': {
        const { phoneNumber } = body;
        if (!phoneNumber) {
          return createErrorResponse(
            new AuthError('Phone number is required', 'INVALID_PHONE')
          );
        }
        await authProvider.sendPhoneVerificationCode(phoneNumber);
        return createSuccessResponse({ message: 'Verification code sent' });
      }

      case 'logout': {
        const response = createSuccessResponse({ message: 'Logged out successfully' });
        response.cookies.delete('auth_token');
        return response;
      }

      default:
        return createErrorResponse(
          new AuthError('Invalid action', 'INVALID_ACTION')
        );
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

// 处理获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const authProvider = AuthServiceFactory.getInstance().getProvider();
    const user = await authProvider.getCurrentUser();
    
    if (!user) {
      return createErrorResponse(
        new AuthError('Not authenticated', 'NOT_AUTHENTICATED'),
        401
      );
    }

    return createSuccessResponse({ user });
  } catch (error) {
    return createErrorResponse(error);
  }
} 