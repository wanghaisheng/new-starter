import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { DataServiceFactory } from '@/core/services/data/data-service-factory';
import { MessageService } from '@/core/services/data/message-service';

/**
 * GET /api/mobile/v1/matches/messages/[id] - 获取特定消息详情
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async () => {
    const messageId = params.id;
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
      const message = await dataService.getMessage(messageId);
      
      if (!message) {
        return APIResponseBuilder.error({
          code: 'NOT_FOUND',
          message: 'Message not found',
          status: 404
        });
      }
      
      // 验证用户是否是消息的发送者或接收者
      if (message.senderId !== userId && message.receiverId !== userId) {
        return APIResponseBuilder.error({
          code: 'FORBIDDEN',
          message: 'You do not have access to this message',
          status: 403
        });
      }
      
      return APIResponseBuilder.success(message);
    } catch (error) {
      console.error('Error fetching message:', error);
      return APIResponseBuilder.error({
        code: 'SERVER_ERROR',
        message: 'Failed to fetch message',
        status: 500
      });
    }
  });
}

/**
 * PATCH /api/mobile/v1/matches/messages/[id] - 更新消息状态（如标记为已读）
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async () => {
    const messageId = params.id;
    const userId = req.headers.get('user-id');
    
    if (!userId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
        status: 400
      });
    }

    try {
      const body = await req.json();
      const { status } = body;
      
      if (!status || !['sent', 'delivered', 'read'].includes(status)) {
        return APIResponseBuilder.error({
          code: 'INVALID_REQUEST',
          message: 'Valid status is required (sent, delivered, read)',
          status: 400
        });
      }
      
      const dataService = DataServiceFactory.getDataService();
      const message = await dataService.getMessage(messageId);
      
      if (!message) {
        return APIResponseBuilder.error({
          code: 'NOT_FOUND',
          message: 'Message not found',
          status: 404
        });
      }
      
      // 验证用户是否是消息的接收者（只有接收者可以更新消息状态）
      if (message.receiverId !== userId) {
        return APIResponseBuilder.error({
          code: 'FORBIDDEN',
          message: 'Only the receiver can update message status',
          status: 403
        });
      }
      
      // 更新消息状态
      const messageService = MessageService.getInstance();
      
      // 如果状态是已读，使用专门的标记已读方法
      if (status === 'read') {
        await messageService.markMessageAsRead(messageId);
      } else {
        // 否则使用通用的更新方法
        await dataService.updateMessage(messageId, { status });
      }
      
      const updatedMessage = await dataService.getMessage(messageId);
      
      return APIResponseBuilder.success(updatedMessage);
    } catch (error) {
      console.error('Error updating message status:', error);
      return APIResponseBuilder.error({
        code: 'SERVER_ERROR',
        message: 'Failed to update message status',
        status: 500
      });
    }
  });
}

/**
 * DELETE /api/mobile/v1/matches/messages/[id] - 删除消息
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async () => {
    const messageId = params.id;
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
      const message = await dataService.getMessage(messageId);
      
      if (!message) {
        return APIResponseBuilder.error({
          code: 'NOT_FOUND',
          message: 'Message not found',
          status: 404
        });
      }
      
      // 验证用户是否是消息的发送者（只有发送者可以删除消息）
      if (message.senderId !== userId) {
        return APIResponseBuilder.error({
          code: 'FORBIDDEN',
          message: 'Only the sender can delete the message',
          status: 403
        });
      }
      
      // 删除消息
      await dataService.deleteMessage(messageId);
      
      return APIResponseBuilder.success({ deleted: true });
    } catch (error) {
      console.error('Error deleting message:', error);
      return APIResponseBuilder.error({
        code: 'SERVER_ERROR',
        message: 'Failed to delete message',
        status: 500
      });
    }
  });
}