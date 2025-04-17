import { NextRequest, NextResponse } from 'next/server';
import { TestService } from '@/core/services/data/quiz-service';
import { handleApiError } from '@/app/api/_lib/utils/response';

/**
 * POST /api/mobile/v1/tests/results
 * 保存测试结果
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, testId, score, answers, traits } = body;
    
    if (!userId || !testId) {
      return NextResponse.json(
        { success: false, message: 'User ID and Test ID are required' },
        { status: 400 }
      );
    }

    const service = TestService.getInstance();
    await service.initialize();
    
    // 获取测试类型以确定testType字段
    const testType = await service.getTestType(testId);
    if (!testType) {
      return NextResponse.json(
        { success: false, message: 'Test not found' },
        { status: 404 }
      );
    }
    
    const result = await service.saveTestResult({
      userId,
      testId,
      testType: testType.type,
      score: score || 0,
      answers,
      traits: traits || [],
      completedAt: new Date().toISOString(),
      details: {} // 根据测试类型生成详细结果
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return handleApiError(error, 'Failed to save test result');
  }
}

/**
 * GET /api/mobile/v1/tests/results
 * 获取测试结果
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
    
    const result = await service.getTestResult(userId, testId);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch test result');
  }
}

/**
 * GET /api/mobile/v1/tests/results/user
 * 获取用户的所有测试结果
 */
export async function GET_USER_RESULTS(request: NextRequest) {
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