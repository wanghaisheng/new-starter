import { NextRequest, NextResponse } from 'next/server';
import { loadDemoData } from '@/core/lib/db/clients/mock/load-demo-data';
import { Logger } from '@/core/lib/utils/logger';

const logger = new Logger('DemoLoadAPI');

/**
 * 加载演示数据API
 * 
 * 使用方法:
 * POST /api/mobile/v1/demo/load?source=example
 * 
 * 参数:
 * - source: 数据源，可选值为 'example' 或 'dating'，默认为 'example'
 * 
 * 返回:
 * - 成功: { success: true, message: '演示数据加载成功', stats: { users: 2, matches: 1, messages: 3 } }
 * - 失败: { success: false, error: '错误信息' }
 */
export async function POST(req: NextRequest) {
  try {
    // 获取数据源参数
    const url = new URL(req.url);
    const source = url.searchParams.get('source') as 'example' | 'dating' || 'example';
    
    logger.info(`开始加载${source}演示数据...`);
    
    // 加载演示数据
    await loadDemoData(source);
    
    // 获取数据统计
    const mockDataService = await import('@/core/services/data/mock-data-service');
    const service = mockDataService.MockDataService.getInstance();
    
    const users = await service.getUsers();
    const matches = await service.getMatches();
    const messages = await service.getMessages();
    
    logger.info(`✅ ${source}演示数据加载完成`);
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: `${source}演示数据加载成功`,
      stats: {
        users: users.length,
        matches: matches.length,
        messages: messages.length
      }
    });
    
  } catch (error) {
    logger.error('加载演示数据失败', { error });
    
    // 返回错误响应
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 