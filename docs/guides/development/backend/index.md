# API 开发指南

## 1. API 架构概览

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
│   │   ├── users/         # 用户相关
│   │   └── tests/         # 测试相关
│   └── middleware.ts      # 全局中间件
└── (mobile)/              # 移动端路由
    └── api/               # 移动端特定API

src/
├── core/
│   ├── hooks/             # React Hooks
│   │   ├── useApi.ts      # API请求Hook
│   │   ├── useAuth.ts     # 认证Hook
│   │   └── useData.ts     # 数据管理Hook
│   ├── services/          # 核心服务
│   │   ├── test-service.ts # 测试服务
│   │   ├── user-service.ts # 用户服务
│   │   └── data-service-factory.ts # 服务工厂
│   └── lib/              # 核心库
       ├── db/            # 数据库访问
       └── api/           # API客户端
```

### 1.2 分层架构
```
UI组件
   ↓
React Hooks (useApi, useAuth, useData)
   ↓
服务层 (TestService, UserService)
   ↓
数据服务工厂 (DataServiceFactory)
   ↓
数据访问层 (DatabaseService/MockDataService)
```

## 2. API 实现最佳实践

### 2.1 API 路由实现
```typescript
// app/api/v1/tests/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { TestService } from '@/core/services/test-service';

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const testService = TestService.getInstance();
    const result = await testService.getTests();
    return APIResponseBuilder.success(result);
  });
}
```

### 2.2 React Hook 实现
```typescript
// src/core/hooks/useApi.ts
import { useState, useCallback } from 'react';
import { APIResponse } from '@/app/api/_lib/utils/response';

export function useApi<T, P = any>(
  apiFunc: (params?: P) => Promise<APIResponse<T>>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (params?: P) => {
    try {
      setLoading(true);
      const response = await apiFunc(params);
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error(response.error?.message);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { data, loading, error, execute };
}
```

### 2.3 服务层实现
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

  async getTests(): Promise<Test[]> {
    return this.dataService.getTests();
  }
}
```

## 3. 服务化与 API 路由设计（当前架构说明）

### 3.1 服务与 API 路由分层

当前项目采用“服务层 + API Router”架构，所有 API 路由（如 `app/api/v1/users/route.ts`）仅负责参数校验、权限判断、响应封装，业务逻辑全部通过核心服务（如 `UserService`、`TestService`）调用完成。这样可实现：
- 路由与业务解耦，便于复用和维护
- 统一错误处理、中间件和响应格式
- 服务层可被前后端、脚本等多场景直接复用

### 3.2 推荐代码结构
```
app/api/v1/users/route.ts      # API 路由，仅处理请求分发和响应
src/core/services/user-service.ts # 业务服务，封装全部业务逻辑
src/core/lib/db/               # 数据库访问与类型定义
```

### 3.3 API 路由实现范式
```typescript
// app/api/v1/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { UserService } from '@/core/services/user-service';

export const GET = withAuth(async (req: NextRequest) => {
  const { page, size } = validateRequest(req, ['page', 'size']);
  const users = await UserService.getInstance().getUsers({ page, size });
  return NextResponse.json({ data: users });
});
```

### 3.4 服务层实现规范
- 服务类（如 `UserService`）必须为单例
- 所有类型、接口统一从 `@/core/lib/db/types` 引入
- 严禁在路由中写业务逻辑或访问数据库，所有数据操作必须通过服务层
- 服务层可组合调用仓库、第三方 API、缓存等

### 3.5 统一类型与依赖注入
- 所有服务、仓库、API 路由均通过 types 层唯一出口导入类型，避免重复声明和命名冲突
- 推荐通过工厂类（如 `DataServiceFactory`）或依赖注入容器管理服务实例，便于测试和环境切换

---

> **总结：当前 API Router 方案下，推荐所有 API 路由只做请求分发和响应封装，全部业务逻辑集中于服务层，类型统一由 types 层导出，避免重复实现和逻辑分散。**

## 4. 数据开发最佳实践

### 4.1 数据服务工厂
```typescript
// src/core/services/data-service-factory.ts
export class DataServiceFactory {
  private static instance: IDataService;

  static getInstance(): IDataService {
    if (!this.instance) {
      const env = process.env.NEXT_PUBLIC_DATABASE_ENV;
      switch (env) {
        case 'mock':
          this.instance = new MockDataService();
          break;
        case 'local':
          this.instance = new DatabaseService();
          break;
        default:
          this.instance = new ProductionDataService();
      }
    }
    return this.instance;
  }
}
```

### 4.2 组件中使用
```typescript
// src/components/TestList.tsx
import { useApi } from '@/core/hooks/useApi';
import { TestService } from '@/core/services/test-service';

export function TestList() {
  const testService = TestService.getInstance();
  const { data, loading, error } = useApi(() => testService.getTests());

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  
  return (
    <ul>
      {data?.map(test => (
        <li key={test.id}>{test.name}</li>
      ))}
    </ul>
  );
}
```

## 5. 环境适配

### 5.1 环境配置
```typescript
// .env.development
NEXT_PUBLIC_DATABASE_ENV=mock

// .env.local
NEXT_PUBLIC_DATABASE_ENV=local

// .env.production
NEXT_PUBLIC_DATABASE_ENV=production
```

### 5.2 环境检测
```typescript
// src/core/lib/env.ts
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getDatabaseEnv(): string {
  return process.env.NEXT_PUBLIC_DATABASE_ENV || 'mock';
}
```

## 6. 错误处理

### 6.1 API 错误处理
```typescript
// app/api/_lib/middleware/error.ts
import { NextRequest, NextResponse } from 'next/server';
import { APIResponseBuilder } from '../utils/response';

export async function withErrorHandler(
  req: NextRequest,
  handler: () => Promise<NextResponse>
) {
  try {
    return await handler();
  } catch (error) {
    console.error('API Error:', error);
    return APIResponseBuilder.error(error);
  }
}
```

### 6.2 前端错误处理
```typescript
// src/core/hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { toast } from 'react-toastify';

export function useErrorHandler() {
  return useCallback((error: Error) => {
    console.error('操作失败:', error);
    toast.error(error.message);
  }, []);
}
```

## 7. 性能优化

### 7.1 数据缓存
```typescript
// src/core/hooks/useCache.ts
import { useCallback } from 'react';
import { CacheService } from '@/core/lib/cache';

export function useCache() {
  const cache = CacheService.getInstance();

  const getCached = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    const cached = await cache.get<T>(key);
    if (cached) return cached;

    const fresh = await fetcher();
    await cache.set(key, fresh, ttl);
    return fresh;
  }, []);

  return { getCached };
}
```

### 7.2 批量操作
```typescript
// src/core/services/base-service.ts
export abstract class BaseService {
  protected async batchOperation<T>(
    items: T[],
    operation: (item: T) => Promise<void>
  ): Promise<void> {
    const batchSize = 50;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(batch.map(operation));
    }
  }
}
```

## 8. 测试策略

### 8.1 API 测试
```typescript
// tests/api/test.test.ts
import { TestService } from '@/core/services/test-service';

describe('Test API', () => {
  let testService: TestService;

  beforeEach(() => {
    testService = TestService.getInstance();
  });

  it('should get tests', async () => {
    const tests = await testService.getTests();
    expect(Array.isArray(tests)).toBe(true);
  });
});
```

### 8.2 Hook 测试
```typescript
// tests/hooks/useApi.test.ts
import { renderHook } from '@testing-library/react-hooks';
import { useApi } from '@/core/hooks/useApi';

describe('useApi', () => {
  it('should handle successful API calls', async () => {
    const mockApi = jest.fn().mockResolvedValue({ 
      success: true, 
      data: ['test'] 
    });

    const { result, waitForNextUpdate } = renderHook(() => 
      useApi(mockApi)
    );

    result.current.execute();
    await waitForNextUpdate();

    expect(result.current.data).toEqual(['test']);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

## 9. 文档规范

### 9.1 API 文档
- 每个API端点都需要包含：
  - 请求方法和路径
  - 请求参数说明
  - 响应格式示例
  - 错误码说明
  - 权限要求

### 9.2 代码注释
- 使用JSDoc格式
- 包含参数类型说明
- 说明可能的错误情况
- 提供使用示例 