import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { UserService } from '@/core/services/data/user-service';

// GET /api/mobile/v1/users/preferences - Get user preferences settings
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

    // Return only user preferences
    return APIResponseBuilder.success(user.preferences || {});
  });
}

// PUT /api/mobile/v1/users/preferences - Update user preferences settings
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
      ageRange: 'object?',
      distance: 'number?',
      gender: 'array?',
      interests: 'array?',
      dealBreakers: 'array?',
      language: 'string?',
      theme: 'object?'
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

    // Update only user preferences
    const updatedUser = await userService.updateUser(userId, {
      preferences: {
        ...user.preferences,
        ...validation.data
      }
    });

    return APIResponseBuilder.success(updatedUser.preferences);
  });
}