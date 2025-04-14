import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { MatchService } from '@/core/services/data/match-service';
import { getAuth } from 'firebase-admin/auth';
import { DataServiceFactory } from '@/core/services/data/data-service-factory';
import { CreateMatchData } from '@/core/lib/db/types/match';

// GET /api/mobile/v1/matches - Get user's matches
export async function GET(req: NextRequest) {
  return withAuth(req, async (req) => {
    const dataService = DataServiceFactory.getDataService();
    const matchService = MatchService.getInstance(dataService);
    
    // Try to get user ID from header first
    let userId = req.headers.get('user-id');
    
    // If not in header, try to get from auth token
    if (!userId) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
      }
    }
    
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

    const dataService = DataServiceFactory.getDataService();
    const matchService = MatchService.getInstance(dataService);
    
    // Create match data with the correct type
    const matchData: CreateMatchData = {
      users: validation.data.users as [string, string],
      status: 'pending'
    };
    
    const match = await matchService.createMatch(matchData);
    return APIResponseBuilder.success(match, { status: 201 });
  });
} 