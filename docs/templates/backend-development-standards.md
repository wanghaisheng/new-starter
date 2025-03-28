# 后端开发规范

## 1. API 路由结构

### 1.1 Next.js API 路由结构
```
app/
├── api/                    # API 路由
│   ├── v1/                # API 版本
│   │   ├── resources/     # 资源端点
│   │   │   ├── route.ts   # 资源路由处理
│   │   │   └── [id]/      # 单个资源
│   │   │       └── route.ts
│   │   └── relationships/ # 关系端点
│   └── middleware.ts      # API 中间件
└── (mobile)/              # 移动端路由
    └── api/               # 移动端特定API
```

### 1.2 API 路由实现
```typescript
// app/api/v1/resources/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/core/lib/db';
import { validateRequest } from '@/core/lib/api/middleware';
import { logger } from '@/core/lib/logger';

export async function GET(request: Request) {
  try {
    // 验证请求
    await validateRequest(request);
    
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 查询数据
    const { data, meta } = await db.getResources({
      page,
      limit
    });
    
    return NextResponse.json({
      data,
      meta
    });
  } catch (error) {
    logger.error('获取资源列表失败', {
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({
      errors: [{
        code: error.code,
        message: error.message
      }]
    }, { status: error.status || 500 });
  }
}

// app/api/v1/resources/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await validateRequest(request);
    
    const resource = await db.getResourceById(params.id);
    
    return NextResponse.json({
      data: resource
    });
  } catch (error) {
    logger.error('获取单个资源失败', {
      id: params.id,
      error: error.message,
      stack: error.stack
    });
    
    return NextResponse.json({
      errors: [{
        code: error.code,
        message: error.message
      }]
    }, { status: error.status || 500 });
  }
}
```

## 2. 数据库开发规范

### 2.1 数据库访问层
```typescript
// src/core/lib/db/index.ts
import { createClient } from '@supabase/supabase-js';
import { DatabaseClient } from './types';
import { logger } from '../logger';

export class DatabaseService {
  private static instance: DatabaseService;
  private client: DatabaseClient;
  
  private constructor() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  async getResources({ page, limit }: { page: number; limit: number }) {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      const { data, count, error } = await this.client
        .from('resources')
        .select('*', { count: 'exact' })
        .range(start, end)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return {
        data,
        meta: {
          page,
          perPage: limit,
          total: count
        }
      };
    } catch (error) {
      logger.error('数据库查询失败', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

### 2.2 数据模型定义
```typescript
// src/core/models/resource.ts
export interface Resource {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  user_id: string;
}

// src/core/models/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}
```

## 3. 错误处理规范

### 3.1 错误类型定义
```typescript
// src/core/lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public details: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
```

### 3.2 错误处理中间件
```typescript
// app/api/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ApiError } from '@/core/lib/api/errors';
import { logger } from '@/core/lib/logger';

export async function middleware(request: NextRequest) {
  try {
    // 验证请求
    await validateRequest(request);
    
    // 处理请求
    const response = await handleRequest(request);
    
    return response;
  } catch (error) {
    logger.error('API请求处理失败', {
      method: request.method,
      url: request.url,
      error: error.message,
      stack: error.stack
    });
    
    if (error instanceof ApiError) {
      return NextResponse.json({
        errors: [{
          code: error.code,
          message: error.message,
          details: error instanceof ValidationError ? error.details : undefined
        }]
      }, { status: error.status });
    }
    
    // 系统错误
    return NextResponse.json({
      errors: [{
        code: 'INTERNAL_ERROR',
        message: '系统内部错误'
      }]
    }, { status: 500 });
  }
}
```

## 4. 日志规范

### 4.1 日志记录
```typescript
// src/core/lib/logger.ts
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

// 使用示例
export async function handleApiRequest(request: Request) {
  logger.info('开始处理API请求', {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString()
  });
  
  try {
    // 处理请求
    logger.info('API请求处理完成', {
      method: request.method,
      url: request.url,
      status: 'success'
    });
  } catch (error) {
    logger.error('API请求处理失败', {
      method: request.method,
      url: request.url,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

## 5. 测试规范

### 5.1 API 测试
```typescript
// test/api/resources.test.ts
import { test, expect } from '@playwright/test';

test('GET /api/v1/resources returns correct response', async ({ request }) => {
  const response = await request.get('/api/v1/resources');
  expect(response.ok()).toBeTruthy();
  
  const data = await response.json();
  expect(data).toHaveProperty('data');
  expect(data).toHaveProperty('meta');
  expect(data.meta).toHaveProperty('page');
  expect(data.meta).toHaveProperty('perPage');
  expect(data.meta).toHaveProperty('total');
});

test('GET /api/v1/resources/:id returns correct resource', async ({ request }) => {
  const response = await request.get('/api/v1/resources/123');
  expect(response.ok()).toBeTruthy();
  
  const data = await response.json();
  expect(data).toHaveProperty('data');
  expect(data.data).toHaveProperty('id');
  expect(data.data).toHaveProperty('name');
});
```

## 6. 安全规范

### 6.1 认证与授权
```typescript
// src/core/lib/auth/index.ts
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';
import { ApiError } from '../api/errors';
import { logger } from '../logger';

export class AuthService {
  private static instance: AuthService;
  private supabase;
  
  private constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  async validateToken(token: string) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET)
      );
      return payload;
    } catch (error) {
      logger.error('令牌验证失败', {
        error: error.message,
        stack: error.stack
      });
      throw new ApiError('无效的认证令牌', 'INVALID_TOKEN', 401);
    }
  }
  
  async checkPermission(userId: string, resourceId: string) {
    try {
      const { data: permission, error } = await this.supabase
        .from('permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('resource_id', resourceId)
        .single();
        
      if (error) throw error;
      
      if (!permission) {
        throw new ApiError('没有访问权限', 'FORBIDDEN', 403);
      }
    } catch (error) {
      logger.error('权限检查失败', {
        userId,
        resourceId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

### 6.2 数据安全
- 使用 HTTPS 传输
- 实现数据加密存储
- 定期数据备份
- 敏感数据脱敏

## 7. 性能规范

### 7.1 缓存策略
```typescript
// src/core/lib/cache/index.ts
import { Redis } from 'ioredis';
import { logger } from '../logger';

export class CacheService {
  private static instance: CacheService;
  private redis: Redis;
  
  private constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    
    this.redis.on('error', (error) => {
      logger.error('Redis连接错误', {
        error: error.message,
        stack: error.stack
      });
    });
  }
  
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('缓存读取失败', {
        key,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }
  
  async set(key: string, value: any, ttl: number = 3600) {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      logger.error('缓存写入失败', {
        key,
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  async invalidate(pattern: string) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('缓存清理失败', {
        pattern,
        error: error.message,
        stack: error.stack
      });
    }
  }
}
```

### 7.2 并发处理
- 使用连接池管理数据库连接
- 实现请求队列
- 使用异步处理耗时操作
- 实现限流机制 