import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { UserService } from '@/core/services/data/user-service';

// GET /api/mobile/v1/users/photos - Get user photos
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

    // Return user photos
    return APIResponseBuilder.success(user.photos || []);
  });
}

// POST /api/mobile/v1/users/photos - Add a new photo
export async function POST(req: NextRequest) {
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
      url: 'string',
      type: 'string?',
      isPrimary: 'boolean?',
      description: 'string?'
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

    // Create new photo object
    const newPhoto = {
      id: Date.now().toString(), // Simple ID generation
      url: validation.data.url,
      type: validation.data.type || 'profile',
      isPrimary: validation.data.isPrimary || false,
      description: validation.data.description || '',
      createdAt: new Date().toISOString()
    };

    // If this is the first photo or marked as primary, update other photos
    const updatedPhotos = [...(user.photos || [])];
    if (newPhoto.isPrimary) {
      updatedPhotos.forEach(photo => photo.isPrimary = false);
    }
    updatedPhotos.push(newPhoto);

    // Update user with new photos array
    const updatedUser = await userService.updateUser(userId, {
      photos: updatedPhotos
    });

    return APIResponseBuilder.success(newPhoto, { status: 201 });
  });
}

// DELETE /api/mobile/v1/users/photos - Delete a photo
export async function DELETE(req: NextRequest) {
  return withAuth(req, async () => {
    const userId = req.headers.get('user-id');
    const photoId = req.nextUrl.searchParams.get('id');
    
    if (!userId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
        status: 400
      });
    }

    if (!photoId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'Photo ID is required',
        status: 400
      });
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

    // Filter out the photo to delete
    const updatedPhotos = (user.photos || []).filter(photo => photo.id !== photoId);
    
    // If we deleted the primary photo, set a new one if available
    if (updatedPhotos.length > 0 && !(updatedPhotos.some(photo => photo.isPrimary))) {
      updatedPhotos[0].isPrimary = true;
    }

    // Update user with new photos array
    const updatedUser = await userService.updateUser(userId, {
      photos: updatedPhotos
    });

    return APIResponseBuilder.success({ success: true });
  });
}