import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/core/services/data/quiz-service';
import { handleApiError } from '@/app/api/_lib/utils/response';

/**
 * GET /api/mobile/v1/tests/[id]
 * 获取特定测试的详细信息
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Test ID is required' },
        { status: 400 }
      );
    }

    const service = TestService.getInstance();
    await service.initialize();
    
    const testType = await service.getTestType(id);
    
    if (!testType) {
      return NextResponse.json(
        { success: false, message: 'Test not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: testType
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch test details');
  }
}