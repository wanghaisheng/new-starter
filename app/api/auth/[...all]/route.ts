import { NextRequest, NextResponse } from 'next/server';
import { AuthServiceFactory } from '@/core/services/auth/auth-service-factory';
import { AuthProviderType, AuthError } from '@/core/services/auth/auth-types';
import { getAuthConfig, isAuthMethodEnabled } from '@/core/services/auth/auth-config';

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
      case 'login':
        if (!provider) {
          return NextResponse.json(
            { error: 'Provider is required' },
            { status: 400 }
          );
        }

        if (!isAuthMethodEnabled(provider)) {
          return NextResponse.json(
            { error: `Authentication method ${provider} is not enabled` },
            { status: 400 }
          );
        }

        let user;
        switch (provider) {
          case 'emailAndPassword':
            const { email, password } = body;
            if (!email || !password) {
              return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
              );
            }
            user = await authProvider.signInWithEmail(email, password);
            break;

          case 'phone':
            const { phoneNumber, verificationCode } = body;
            if (!phoneNumber || !verificationCode) {
              return NextResponse.json(
                { error: 'Phone number and verification code are required' },
                { status: 400 }
              );
            }
            user = await authProvider.signInWithPhone({ phoneNumber, verificationCode });
            break;

          case 'google':
          case 'facebook':
          case 'apple':
            const { token } = body;
            if (!token) {
              return NextResponse.json(
                { error: 'Social token is required' },
                { status: 400 }
              );
            }
            user = await authProvider.signInWithProvider(provider);
            break;

          default:
            return NextResponse.json(
              { error: 'Invalid provider' },
              { status: 400 }
            );
        }

        return NextResponse.json({ user });

      case 'register':
        const { email, password, ...userData } = body;
        if (!email || !password) {
          return NextResponse.json(
            { error: 'Email and password are required' },
            { status: 400 }
          );
        }
        const newUser = await authProvider.createUser({ email, ...userData });
        return NextResponse.json({ user: newUser });

      case 'verify-email':
        const { code } = body;
        if (!code) {
          return NextResponse.json(
            { error: 'Verification code is required' },
            { status: 400 }
          );
        }
        await authProvider.verifyEmail(code);
        return NextResponse.json({ success: true });

      case 'reset-password':
        const { email: resetEmail } = body;
        if (!resetEmail) {
          return NextResponse.json(
            { error: 'Email is required' },
            { status: 400 }
          );
        }
        await authProvider.resetPassword(resetEmail);
        return NextResponse.json({ success: true });

      case 'send-verification-code':
        const { phoneNumber } = body;
        if (!phoneNumber) {
          return NextResponse.json(
            { error: 'Phone number is required' },
            { status: 400 }
          );
        }
        await authProvider.sendPhoneVerificationCode(phoneNumber);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 处理获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    const authProvider = AuthServiceFactory.getInstance().getProvider();
    const user = await authProvider.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 