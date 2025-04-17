import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/core/services/data/quiz-service';
import { handleApiError } from '@/app/api/_lib/utils/response';

/**
 * GET /api/mobile/v1/tests/[id]/questions
 * 获取特定测试的问题列表
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
    
    const questions = await service.getTestQuestions(id);
    
    return NextResponse.json({
      success: true,
      data: questions
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch test questions');
  }
}