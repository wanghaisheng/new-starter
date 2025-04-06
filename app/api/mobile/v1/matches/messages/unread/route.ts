import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { DataServiceFactory } from '@/core/services/data/data-service-factory';
import { MessageService } from '@/core/services/data/message-service';

/**
 * GET /api/mobile/v1/matches/messages/unread - 获取用户未读消息数量
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');
    const userId = req.headers.get('user-id');
    
    if (!userId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
        status: 400
      });
    }

    try {
      const dataService = DataServiceFactory.getDataService();
      const messageService = MessageService.getInstance();
      
      // 如果提供了matchId，则获取特定匹配的未读消息数量
      if (matchId) {
        // 验证用户是否有权限访问该匹配
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
        
        // 获取特定匹配的未读消息
        const messages = await messageService.getMessages(matchId);
        const unreadCount = messages.filter(msg => 
          msg.receiverId === userId && msg.status !== 'read'
        ).length;
        
        return APIResponseBuilder.success({ unreadCount });
      } else {
        // 获取所有匹配的未读消息总数
        const unreadCount = await dataService.getUnreadMessages(userId);
        return APIResponseBuilder.success({ unreadCount });
      }
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
      return APIResponseBuilder.error({
        code: 'SERVER_ERROR',
        message: 'Failed to fetch unread messages count',
        status: 500
      });
    }
  });
}