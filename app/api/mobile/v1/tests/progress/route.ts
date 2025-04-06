import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/core/services/test/test-type-service';
import { handleApiError } from '@/app/api/_lib/utils/response';

/**
 * POST /api/mobile/v1/tests/progress
 * 保存测试进度
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, testId, currentQuestionIndex, answers } = body;
    
    if (!userId || !testId) {
      return NextResponse.json(
        { success: false, message: 'User ID and Test ID are required' },
        { status: 400 }
      );
    }

    const service = TestService.getInstance();
    await service.initialize();
    
    const progress = await service.saveTestProgress({
      userId,
      testId,
      currentQuestionIndex: currentQuestionIndex || 0,
      answers: answers || {}
    });
    
    return NextResponse.json({
      success: true,
      data: progress
    });
  } catch (error) {
    return handleApiError(error, 'Failed to save test progress');
  }
}

/**
 * GET /api/mobile/v1/tests/progress
 * 获取测试进度
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const testId = searchParams.get('testId');
    
    if (!userId || !testId) {
      return NextResponse.json(
        { success: false, message: 'User ID and Test ID are required' },
        { status: 400 }
      );
    }

    const service = TestService.getInstance();
    await service.initialize();
    
    const progress = await service.getTestProgress(userId, testId);
    
    return NextResponse.json({
      success: true,
      data: progress
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch test progress');
  }
}