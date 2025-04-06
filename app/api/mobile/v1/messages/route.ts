import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { MessageService } from '@/core/services/data/message-service';

// GET /api/mobile/v1/chats - Get user's chat messages
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const chatService = MessageService.getInstance();
    const userId = req.headers.get('user-id');
    const matchId = req.nextUrl.searchParams.get('matchId');
    
    if (!userId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
        status: 400
      });
    }

    if (matchId) {
      // Get messages for a specific match
      const messages = await chatService.getMatchMessages(matchId);
      return APIResponseBuilder.success(messages);
    } else {
      // Get all chats for the user
      const chats = await chatService.getUserChats(userId);
      return APIResponseBuilder.success(chats);
    }
  });
}

// POST /api/mobile/v1/chats - Send a new message
export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    const validation = await validateRequest(req, {
      matchId: 'string',
      senderId: 'string',
      content: 'string',
      type: 'string?' // Optional, defaults to 'text'
    });

    if (!validation.success) {
      return validation.response;
    }

    const chatService = ChatService.getInstance();
    const message = await chatService.sendMessage(validation.data);
    return APIResponseBuilder.success(message, { status: 201 });
  });
} 