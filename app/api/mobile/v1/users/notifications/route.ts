import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { UserService } from '@/core/services/data/user-service';

// GET /api/mobile/v1/users/notifications - Get user notification settings
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const userService = UserService.getInstance();
    const userId = req.headers.get('user-id');
    
    if (!userId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
        status: 400
      });
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      return APIResponseBuilder.error({
        code: 'NOT_FOUND',
        message: 'User not found',
        status: 404
      });
    }

    // Return only notification settings
    return APIResponseBuilder.success(user.notificationSettings || {});
  });
}

// PUT /api/mobile/v1/users/notifications - Update user notification settings
export async function PUT(req: NextRequest) {
  return withAuth(req, async () => {
    const userId = req.headers.get('user-id');
    
    if (!userId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
        status: 400
      });
    }

    const validation = await validateRequest(req, {
      newMatches: 'boolean?',
      matchMessages: 'boolean?',
      profileViews: 'boolean?',
      profileLikes: 'boolean?',
      appUpdates: 'boolean?',
      promotions: 'boolean?'
    });

    if (!validation.success) {
      return validation.response;
    }

    const userService = UserService.getInstance();
    
    // Get current user first
    const user = await userService.getUserById(userId);
    if (!user) {
      return APIResponseBuilder.error({
        code: 'NOT_FOUND',
        message: 'User not found',
        status: 404
      });
    }

    // Update only notification settings
    const updatedUser = await userService.updateUser(userId, {
      notificationSettings: {
        ...user.notificationSettings,
        ...validation.data
      }
    });

    return APIResponseBuilder.success(updatedUser.notificationSettings);
  });
}