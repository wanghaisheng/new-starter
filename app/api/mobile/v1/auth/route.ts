import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { AuthService } from '@/core/services/auth/auth-service';

// POST /api/mobile/v1/auth/login - User login
export async function POST(req: NextRequest) {
  const validation = await validateRequest(req, {
    email: 'string?',
    password: 'string?',
    phoneNumber: 'string?',
    verificationCode: 'string?'
  });

  if (!validation.success) {
    return validation.response;
  }

  try {
    const authService = AuthService.getInstance();
    const { email, password, phoneNumber, verificationCode } = validation.data;

    // Email/password login
    if (email && password) {
      const result = await authService.loginWithEmailPassword(email, password);
      return APIResponseBuilder.success(result);
    }
    
    // Phone/verification code login
    if (phoneNumber && verificationCode) {
      const result = await authService.loginWithPhone(phoneNumber, verificationCode);
      return APIResponseBuilder.success(result);
    }

    return APIResponseBuilder.error({
      code: 'INVALID_REQUEST',
      message: 'Invalid login credentials',
      status: 400
    });
  } catch (error) {
    console.error('Login error:', error);
    return APIResponseBuilder.error({
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
      status: 401
    });
  }
}