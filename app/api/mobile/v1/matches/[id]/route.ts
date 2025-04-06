import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { MatchService } from '@/core/services/data/match-service';
import { DataServiceFactory } from '@/core/services/data/data-service-factory';

/**
 * GET /api/mobile/v1/matches/[id] - 获取特定匹配详情
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async () => {
    const matchId = params.id;
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
      const matchService = MatchService.getInstance(dataService);
      
      // 获取匹配详情
      const match = await dataService.getMatch(matchId);
      
      if (!match) {
        return APIResponseBuilder.error({
          code: 'NOT_FOUND',
          message: 'Match not found',
          status: 404
        });
      }
      
      // 验证用户是否是匹配的参与者
      if (!match.users.includes(userId)) {
        return APIResponseBuilder.error({
          code: 'FORBIDDEN',
          message: 'You do not have access to this match',
          status: 403
        });
      }
      
      return APIResponseBuilder.success(match);
    } catch (error) {
      console.error('Error fetching match details:', error);
      return APIResponseBuilder.error({
        code: 'SERVER_ERROR',
        message: 'Failed to fetch match details',
        status: 500
      });
    }
  });
}

/**
 * PATCH /api/mobile/v1/matches/[id] - 更新匹配状态
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async () => {
    const matchId = params.id;
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
      
      if (!status || !['pending', 'matched', 'rejected'].includes(status)) {
        return APIResponseBuilder.error({
          code: 'INVALID_REQUEST',
          message: 'Valid status is required (pending, matched, rejected)',
          status: 400
        });
      }
      
      const dataService = DataServiceFactory.getDataService();
      const matchService = MatchService.getInstance(dataService);
      
      // 获取匹配详情以验证用户权限
      const match = await dataService.getMatch(matchId);
      
      if (!match) {
        return APIResponseBuilder.error({
          code: 'NOT_FOUND',
          message: 'Match not found',
          status: 404
        });
      }
      
      // 验证用户是否是匹配的参与者
      if (!match.users.includes(userId)) {
        return APIResponseBuilder.error({
          code: 'FORBIDDEN',
          message: 'You do not have access to this match',
          status: 403
        });
      }
      
      // 更新匹配状态
      const updatedMatch = await matchService.updateMatch(matchId, { status });
      
      return APIResponseBuilder.success(updatedMatch);
    } catch (error) {
      console.error('Error updating match status:', error);
      return APIResponseBuilder.error({
        code: 'SERVER_ERROR',
        message: 'Failed to update match status',
        status: 500
      });
    }
  });
}