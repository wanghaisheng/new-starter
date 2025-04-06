import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/core/services/test/test-type-service';
import { handleApiError } from '@/app/api/_lib/utils/response';

/**
 * GET /api/mobile/v1/tests/results/user
 * 获取用户的所有测试结果
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    const service = TestService.getInstance();
    await service.initialize();
    
    const results = await service.getUserTestResults(userId);
    
    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch user test results');
  }
}