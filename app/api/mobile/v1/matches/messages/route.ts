import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { DataServiceFactory } from '@/core/services/data/data-service-factory';
import { MessageService } from '@/core/services/data/message-service';

/**
 * GET /api/mobile/v1/matches/messages - 获取匹配的消息列表
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');
    const userId = req.headers.get('user-id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const orderBy = searchParams.get('orderBy') === 'desc' ? { createdAt: 'desc' as const } : { createdAt: 'asc' as const };
    
    if (!userId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
        status: 400
      });
    }

    if (!matchId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'Match ID is required',
        status: 400
      });
    }

    try {
      const dataService = DataServiceFactory.getDataService();
      
      // 验证用户是否有权限访问该匹配的消息
      const match = await dataService.getMatch(matchId);
      if (!match) {
        return APIResponseBuilder.error({
          code: 'NOT_FOUND',
          message: 'Match not found',
          status: 404
        });
      }
      
      if (!match.users.includes(userId)) {
        return APIResponseBuilder.error({
          code: 'FORBIDDEN',
          message: 'You do not have access to this match',
          status: 403
        });
      }
      
      // 获取消息列表
      const messageService = MessageService.getInstance();
      const messages = await messageService.getMessages(matchId, { limit, orderBy });
      
      return APIResponseBuilder.success(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return APIResponseBuilder.error({
        code: 'SERVER_ERROR',
        message: 'Failed to fetch messages',
        status: 500
      });
    }
  });
}

/**
 * POST /api/mobile/v1/matches/messages - 发送新消息
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    const validation = await validateRequest(req, {
      matchId: 'string',
      receiverId: 'string',
      content: 'string',
      type: 'string?'
    });

    if (!validation.success) {
      return validation.response;
    }

    const userId = req.headers.get('user-id');
    if (!userId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
        status: 400
      });
    }

    const { matchId, receiverId, content, type = 'text' } = validation.data;

    try {
      const dataService = DataServiceFactory.getDataService();
      
      // 验证用户是否有权限发送消息到该匹配
      const match = await dataService.getMatch(matchId);
      if (!match) {
        return APIResponseBuilder.error({
          code: 'NOT_FOUND',
          message: 'Match not found',
          status: 404
        });
      }
      
      if (!match.users.includes(userId)) {
        return APIResponseBuilder.error({
          code: 'FORBIDDEN',
          message: 'You do not have access to this match',
          status: 403
        });
      }
      
      // 验证接收者是否是匹配的另一方
      if (!match.users.includes(receiverId)) {
        return APIResponseBuilder.error({
          code: 'INVALID_REQUEST',
          message: 'Receiver is not part of this match',
          status: 400
        });
      }
      
      // 发送消息
      const messageService = MessageService.getInstance();
      const message = await messageService.sendMessage(
        matchId,
        userId,
        receiverId,
        content,
        type as 'text' | 'image'
      );
      
      return APIResponseBuilder.success(message, { status: 201 });
    } catch (error) {
      console.error('Error sending message:', error);
      return APIResponseBuilder.error({
        code: 'SERVER_ERROR',
        message: 'Failed to send message',
        status: 500
      });
    }
  });
}