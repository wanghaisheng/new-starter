# 后端开发规范

## 1. API 架构

### 1.1 目录结构
```
app/
├── api/                    # API 路由根目录
│   ├── _lib/              # API共享工具和中间件
│   │   ├── middleware/    # 中间件
│   │   │   ├── auth.ts    # 认证中间件
│   │   │   ├── cors.ts    # CORS中间件
│   │   │   └── error.ts   # 错误处理中间件
│   │   ├── utils/         # 工具函数
│   │   │   ├── response.ts # 响应格式化
│   │   │   └── validation.ts # 请求验证
│   │   └── constants.ts   # API常量
│   ├── v1/                # API版本1
│   │   ├── auth/          # 认证相关
│   │   │   └── route.ts   # 认证路由
│   │   ├── users/         # 用户相关
│   │   │   ├── route.ts   # 用户列表
│   │   │   └── [id]/      # 单个用户
│   │   │       └── route.ts
│   │   └── tests/         # 测试相关
│   │       ├── route.ts   # 测试列表
│   │       └── [id]/      # 单个测试
│   │           └── route.ts
│   └── middleware.ts      # 全局中间件
└── (mobile)/              # 移动端路由
    └── api/               # 移动端特定API
```

### 1.2 API实现规范

#### 1.2.1 路由处理
```typescript
// app/api/v1/tests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { TestService } from '@/core/services/test-service';
import { testSchema } from '@/core/schemas/test';

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    try {
      const testService = TestService.getInstance();
      const types = await testService.getTestTypes();
      return NextResponse.json(APIResponseBuilder.success(types));
    } catch (error) {
      return APIResponseBuilder.error(error);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    const validation = await validateRequest(req, testSchema);
    if (!validation.success) {
      return validation.response;
    }

    try {
      const testService = TestService.getInstance();
      const result = await testService.createTest(validation.data);
      return NextResponse.json(
        APIResponseBuilder.success(result),
        { status: 201 }
      );
    } catch (error) {
      return APIResponseBuilder.error(error);
    }
  });
}
```

#### 1.2.2 响应格式
```typescript
// app/api/_lib/utils/response.ts
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
  };
}

export class APIResponseBuilder {
  static success<T>(data: T, meta?: APIResponse['meta']): APIResponse<T> {
    return {
      success: true,
      data,
      meta
    };
  }

  static error(error: any): NextResponse {
    const response: APIResponse = {
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || '系统内部错误'
      }
    };

    if (error.details) {
      response.error.details = error.details;
    }

    return NextResponse.json(response, { 
      status: error.status || 500 
    });
  }
}
```

## 2. 服务层规范

### 2.1 服务实现
```typescript
// src/core/services/test-service.ts
export class TestService {
  private static instance: TestService;
  private dataService: IDataService;

  private constructor() {
    this.dataService = DataServiceFactory.getInstance();
  }

  static getInstance(): TestService {
    if (!TestService.instance) {
      TestService.instance = new TestService();
    }
    return TestService.instance;
  }

  async getTestTypes(): Promise<TestType[]> {
    try {
      return await this.dataService.getTestTypes();
    } catch (error) {
      logger.error('获取测试类型失败', { error });
      throw new ServiceError('获取测试类型失败', error);
    }
  }

  async createTest(data: CreateTestDTO): Promise<Test> {
    try {
      return await this.dataService.createTest(data);
    } catch (error) {
      logger.error('创建测试失败', { error, data });
      throw new ServiceError('创建测试失败', error);
    }
  }
}
```

### 2.2 错误处理
```typescript
// src/core/lib/errors/service-error.ts
export class ServiceError extends Error {
  constructor(
    message: string,
    public originalError?: any,
    public code: string = 'SERVICE_ERROR',
    public status: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
```

## 3. 数据访问规范

### 3.1 数据服务接口
```typescript
// src/core/lib/db/interfaces.ts
export interface IDataService {
  initialize(): Promise<void>;
  getClient(): IDatabaseClient;
  
  // 测试相关
  getTestTypes(): Promise<TestType[]>;
  getTestById(id: string): Promise<Test | null>;
  createTest(data: CreateTestDTO): Promise<Test>;
  updateTest(id: string, data: Partial<Test>): Promise<Test>;
  deleteTest(id: string): Promise<void>;
  
  // 其他方法...
}
```

### 3.2 数据库客户端
```typescript
// src/core/lib/db/clients/base-client.ts
export abstract class BaseDatabaseClient implements IDatabaseClient {
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract query<T>(options: QueryOptions): Promise<T[]>;
  abstract findById<T>(collection: string, id: string): Promise<T | null>;
  abstract create<T>(collection: string, data: any): Promise<T>;
  abstract update<T>(collection: string, id: string, data: any): Promise<T>;
  abstract delete(collection: string, id: string): Promise<void>;
}
```

## 4. 测试规范

### 4.1 单元测试
```typescript
// test/services/test-service.test.ts
describe('TestService', () => {
  let testService: TestService;
  let mockDataService: jest.Mocked<IDataService>;

  beforeEach(() => {
    mockDataService = {
      getTestTypes: jest.fn(),
      createTest: jest.fn()
    } as any;

    // 注入mock数据服务
    jest.spyOn(DataServiceFactory, 'getInstance')
      .mockReturnValue(mockDataService);

    testService = TestService.getInstance();
  });

  describe('getTestTypes', () => {
    it('should return test types', async () => {
      const mockTypes = [{ id: '1', name: 'Test' }];
      mockDataService.getTestTypes.mockResolvedValue(mockTypes);

      const result = await testService.getTestTypes();
      expect(result).toEqual(mockTypes);
    });

    it('should handle errors', async () => {
      mockDataService.getTestTypes.mockRejectedValue(new Error('DB Error'));

      await expect(testService.getTestTypes())
        .rejects
        .toThrow('获取测试类型失败');
    });
  });
});
```

### 4.2 集成测试
```typescript
// test/api/tests.test.ts
describe('Tests API', () => {
  it('GET /api/v1/tests should return test types', async () => {
    const response = await request(app)
      .get('/api/v1/tests')
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /api/v1/tests should create new test', async () => {
    const testData = {
      type: 'personality',
      questions: []
    };

    const response = await request(app)
      .post('/api/v1/tests')
      .set('Authorization', `Bearer ${testToken}`)
      .send(testData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

## 5. 安全规范

### 5.1 认证中间件
```typescript
// app/api/_lib/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { APIResponseBuilder } from '../utils/response';

export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json(
        APIResponseBuilder.error({
          code: 'UNAUTHORIZED',
          message: '需要认证',
          status: 401
        })
      );
    }
    return handler(req);
  } catch (error) {
    return APIResponseBuilder.error(error);
  }
}
```

### 5.2 请求验证
```typescript
// app/api/_lib/utils/validation.ts
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { APIResponseBuilder } from './response';

export async function validateRequest<T>(
  req: NextRequest,
  schema: z.Schema<T>
): Promise<
  { success: true; data: T } | 
  { success: false; response: NextResponse }
> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          APIResponseBuilder.error({
            code: 'VALIDATION_ERROR',
            message: '请求数据验证失败',
            details: error.errors,
            status: 400
          })
        )
      };
    }
    return {
      success: false,
      response: APIResponseBuilder.error({
        code: 'PARSE_ERROR',
        message: '请求数据解析失败',
        status: 400
      })
    };
  }
}
```

## 6. 日志规范

### 6.1 日志配置
```typescript
// src/core/lib/logger/index.ts
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ 
      filename: 'logs/error.log',
      level: 'error'
    }),
    new transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

### 6.2 日志使用
```typescript
// 服务层日志
logger.info('开始处理请求', {
  service: 'TestService',
  method: 'getTestTypes',
  userId: user.id
});

// 错误日志
logger.error('操作失败', {
  service: 'TestService',
  method: 'createTest',
  error: error.message,
  stack: error.stack,
  data: testData
});

// 性能日志
logger.debug('数据库查询完成', {
  service: 'TestService',
  method: 'getTestTypes',
  duration: endTime - startTime,
  resultCount: results.length
});
```

## 7. 性能优化

### 7.1 缓存策略
```typescript
// src/core/lib/cache/index.ts
export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, any>;
  private ttls: Map<string, number>;

  private constructor() {
    this.cache = new Map();
    this.ttls = new Map();
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const expireTime = this.ttls.get(key);
    if (expireTime && Date.now() > expireTime) {
      this.cache.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    this.cache.set(key, value);
    this.ttls.set(key, Date.now() + ttl * 1000);
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = Array.from(this.cache.keys())
      .filter(key => key.startsWith(pattern));
    
    keys.forEach(key => {
      this.cache.delete(key);
      this.ttls.delete(key);
    });
  }
}
```

### 7.2 数据库优化
```typescript
// src/core/lib/db/clients/database-client.ts
export class DatabaseClient extends BaseDatabaseClient {
  private connectionPool: Pool;

  constructor(config: DatabaseConfig) {
    super();
    this.connectionPool = new Pool(config);
  }

  async query<T>(options: QueryOptions): Promise<T[]> {
    const client = await this.connectionPool.connect();
    try {
      const result = await client.query(options.sql, options.params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // 批量操作优化
  async batchCreate<T>(
    collection: string,
    items: any[]
  ): Promise<T[]> {
    const client = await this.connectionPool.connect();
    try {
      await client.query('BEGIN');
      const results = await Promise.all(
        items.map(item => 
          client.query(
            `INSERT INTO ${collection} (...) VALUES (...)`,
            Object.values(item)
          )
        )
      );
      await client.query('COMMIT');
      return results.map(r => r.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```