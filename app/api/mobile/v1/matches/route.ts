import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { MatchService } from '@/core/services/match-service';

// GET /api/mobile/v1/matches - Get user's matches
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const matchService = MatchService.getInstance();
    const userId = req.headers.get('user-id');
    
    if (!userId) {
      return APIResponseBuilder.error({
        code: 'INVALID_REQUEST',
        message: 'User ID is required',
        status: 400
      });
    }

    const matches = await matchService.getUserMatches(userId);
    return APIResponseBuilder.success(matches);
  });
}

// POST /api/mobile/v1/matches - Create a new match
export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    const validation = await validateRequest(req, {
      users: ['string', 'string'] // Requires exactly two user IDs
    });

    if (!validation.success) {
      return validation.response;
    }

    const matchService = MatchService.getInstance();
    const match = await matchService.createMatch(validation.data.users);
    return APIResponseBuilder.success(match, { status: 201 });
  });
} 