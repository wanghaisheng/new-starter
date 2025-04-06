import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { withRateLimit } from '@/app/api/_lib/middleware/rate-limit';
import { withErrorHandler } from '@/app/api/_lib/middleware/error-handler';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { apiConfig } from '@/app/api/_lib/config';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';

// 初始化 Firebase Admin
if (!getApps().length) {
  initializeApp();
}

// GET /api/mobile/v1/users
export async function GET(req: NextRequest) {
  return withErrorHandler(
    req,
    async (req) => {
      return withRateLimit(
        req,
        async (req) => {
          return withAuth(req, async (req) => {
            try {
              const authHeader = req.headers.get('authorization');
              if (!authHeader?.startsWith('Bearer ')) {
                throw new Error('Missing or invalid authorization header');
              }

              const token = authHeader.split('Bearer ')[1];
              const decodedToken = await getAuth().verifyIdToken(token);
              const userId = decodedToken.uid;

              // 这里应该从数据库获取用户信息
              // 为了示例，我们返回一个模拟的用户对象
              const user = {
                id: userId,
                email: decodedToken.email,
                name: decodedToken.name || 'Anonymous',
                createdAt: new Date().toISOString()
              };

              return APIResponseBuilder.success(user);
            } catch (error) {
              console.error('Error fetching user:', error);
              throw error;
            }
          });
        },
        apiConfig.rateLimit
      );
    },
    apiConfig.errorHandler
  );
}

// PUT /api/mobile/v1/users
export async function PUT(req: NextRequest) {
  return withErrorHandler(
    req,
    async (req) => {
      return withRateLimit(
        req,
        async (req) => {
          return withAuth(req, async (req) => {
            try {
              const authHeader = req.headers.get('authorization');
              if (!authHeader?.startsWith('Bearer ')) {
                throw new Error('Missing or invalid authorization header');
              }

              const token = authHeader.split('Bearer ')[1];
              const decodedToken = await getAuth().verifyIdToken(token);
              const userId = decodedToken.uid;

              const body = await req.json();
              const { name, email } = body;

              if (!name && !email) {
                return APIResponseBuilder.error({
                  code: 'VALIDATION_ERROR',
                  message: 'At least one field (name or email) is required',
                  status: 400
                });
              }

              // 这里应该更新数据库中的用户信息
              // 为了示例，我们返回更新后的用户对象
              const updatedUser = {
                id: userId,
                email: email || decodedToken.email,
                name: name || decodedToken.name || 'Anonymous',
                updatedAt: new Date().toISOString()
              };

              return APIResponseBuilder.success(updatedUser);
            } catch (error) {
              console.error('Error updating user:', error);
              throw error;
            }
          });
        },
        apiConfig.rateLimit
      );
    },
    apiConfig.errorHandler
  );
}