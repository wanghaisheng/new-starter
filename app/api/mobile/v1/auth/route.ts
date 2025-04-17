import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { AuthService } from '@/core/services-update/business/auth/service/auth-service';

// POST /api/mobile/v1/auth/login - User login
export async function POST(req: NextRequest) {
  const validation = await validateRequest(req, {
    email: 'string?',
    password: 'string?',
    phoneNumber: 'string?',
    verificationCode: 'string?',
    provider: 'string?',
    providerToken: 'string?'
  });

  if (!validation.success) {
    return validation.response;
  }

  try {
    const authService = new AuthService(process.env.AUTH_TYPE as any || 'mock');
    const { email, password, phoneNumber, verificationCode, provider, providerToken } = validation.data;

    // Email/password login
    if (email && password) {
      const result = await authService.loginWithEmail(email, password);
      return APIResponseBuilder.success(result);
    }
    // Phone/verification code login
    if (phoneNumber && verificationCode) {
      const result = await authService.loginWithPhone(phoneNumber, verificationCode);
      return APIResponseBuilder.success(result);
    }
    // 第三方登录（如 Google/Apple/Wechat）
    if (provider && providerToken) {
      const result = await authService.loginWithProvider(provider, providerToken);
      return APIResponseBuilder.success(result);
    }
    return APIResponseBuilder.error({
      code: 'INVALID_REQUEST',
      message: 'Invalid login credentials',
      status: 400
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return APIResponseBuilder.error({
      code: 'AUTH_ERROR',
      message: error.message || 'Authentication failed',
      status: 401
    });
  }
}

// GET /api/mobile/v1/auth/me - 获取当前用户
export async function GET(req: NextRequest) {
  try {
    const authService = new AuthService(process.env.AUTH_TYPE as any || 'mock');
    const user = await authService.getCurrentUser();
    if (user) return APIResponseBuilder.success(user);
    return APIResponseBuilder.error({
      code: 'NOT_LOGGED_IN',
      message: 'User not logged in',
      status: 401
    });
  } catch (error: any) {
    return APIResponseBuilder.error({
      code: 'AUTH_ERROR',
      message: error.message || 'Failed to get user',
      status: 401
    });
  }
}

// DELETE /api/mobile/v1/auth/logout - 用户登出
export async function DELETE(req: NextRequest) {
  try {
    const authService = new AuthService(process.env.AUTH_TYPE as any || 'mock');
    await authService.logout();
    return APIResponseBuilder.success({ ok: true });
  } catch (error: any) {
    return APIResponseBuilder.error({
      code: 'LOGOUT_ERROR',
      message: error.message || 'Logout failed',
      status: 400
    });
  }
}

// PUT /api/mobile/v1/auth/refresh - 刷新 token
export async function PUT(req: NextRequest) {
  try {
    const authService = new AuthService(process.env.AUTH_TYPE as any || 'mock');
    const token = await authService.refreshToken();
    return APIResponseBuilder.success({ token });
  } catch (error: any) {
    return APIResponseBuilder.error({
      code: 'REFRESH_ERROR',
      message: error.message || 'Token refresh failed',
      status: 400
    });
  }
}