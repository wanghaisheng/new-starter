import { NextRequest, NextResponse } from 'next/server';
import { APIResponseBuilder } from '../utils/response';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';

// 初始化 Firebase Admin
if (!getApps().length) {
  initializeApp();
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
};

class RateLimiter {
  private static instance: RateLimiter;
  private ipStore: Map<string, { count: number; resetTime: number }>;
  private userStore: Map<string, { count: number; resetTime: number }>;
  private config: RateLimitConfig;

  private constructor(config: RateLimitConfig = defaultConfig) {
    this.config = config;
    this.ipStore = new Map();
    this.userStore = new Map();
    this.cleanup();
  }

  public static getInstance(config?: RateLimitConfig): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter(config);
    }
    return RateLimiter.instance;
  }

  private cleanup() {
    const now = Date.now();
    // Clean up IP store
    Array.from(this.ipStore.entries()).forEach(([ip, data]) => {
      if (now > data.resetTime) {
        this.ipStore.delete(ip);
      }
    });
    // Clean up user store
    Array.from(this.userStore.entries()).forEach(([userId, data]) => {
      if (now > data.resetTime) {
        this.userStore.delete(userId);
      }
    });
    // Schedule next cleanup
    setTimeout(() => this.cleanup(), this.config.windowMs);
  }

  private getKeyData(store: Map<string, { count: number; resetTime: number }>, key: string) {
    const now = Date.now();
    const data = store.get(key);
    
    if (!data || now > data.resetTime) {
      return {
        count: 1,
        resetTime: now + this.config.windowMs
      };
    }
    
    return {
      count: data.count + 1,
      resetTime: data.resetTime
    };
  }

  public checkLimit(ip: string, userId?: string): { limited: boolean; resetTime?: number } {
    const ipData = this.getKeyData(this.ipStore, ip);
    this.ipStore.set(ip, ipData);

    if (ipData.count > this.config.max) {
      return { limited: true, resetTime: ipData.resetTime };
    }

    if (userId) {
      const userData = this.getKeyData(this.userStore, userId);
      this.userStore.set(userId, userData);

      if (userData.count > this.config.max) {
        return { limited: true, resetTime: userData.resetTime };
      }
    }

    return { limited: false };
  }
}

export async function withRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
): Promise<NextResponse> {
  const limiter = RateLimiter.getInstance(config);
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // 获取用户ID
  let userId: string | undefined;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      // 如果token验证失败，继续使用IP限制
      console.warn('Token verification failed:', error);
    }
  }

  const { limited, resetTime } = limiter.checkLimit(ip, userId);

  if (limited) {
    return APIResponseBuilder.error({
      code: 'RATE_LIMIT_EXCEEDED',
      message: config?.message ?? defaultConfig.message ?? 'Rate limit exceeded',
      status: 429,
      details: {
        resetTime
      }
    });
  }

  return handler(req);
} 