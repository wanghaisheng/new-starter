import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            status: 401
          }
        },
        { status: 401 }
      );
    }
    return handler(req);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication error',
          status: 500
        }
      },
      { status: 500 }
    );
  }
} 