import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/core/services/data/quiz-service';
import { handleApiError } from '@/app/api/_lib/utils/response';

/**
 * GET /api/mobile/v1/tests
 * 获取所有测试类型
 */
export async function GET(request: NextRequest) {
  try {
    const service = TestService.getInstance();
    await service.initialize();
    
    const testTypes = await service.getTestTypes();
    
    return NextResponse.json({
      success: true,
      data: testTypes
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch test types');
  }
}