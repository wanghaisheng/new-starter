import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { DataServiceFactory } from '@/core/services/data/data-service-factory';

// GET /api/mobile/v1/users/all - Get all users
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const dataService = DataServiceFactory.getDataService();
      const users = await dataService.getUsers();
      
      return APIResponseBuilder.success(users);
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  });
} 