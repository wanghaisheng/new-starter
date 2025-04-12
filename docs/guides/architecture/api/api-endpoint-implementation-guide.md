# API 实现指南

## 1. API 路由实现

### 1.1 基本路由结构
```typescript
// app/api/v1/tests/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { validateRequest } from '@/app/api/_lib/utils/validation';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { TestService } from '@/core/services/test-service';
import { testSchema } from '@/core/schemas/test';

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const testService = TestService.getInstance();
    const result = await testService.getTests();
    return APIResponseBuilder.success(result);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    const validation = await validateRequest(req, testSchema);
    if (!validation.success) {
      return validation.response;
    }

    const testService = TestService.getInstance();
    const result = await testService.createTest(validation.data);
    return APIResponseBuilder.success(result, { status: 201 });
  });
}
```

### 1.2 动态路由实现
```typescript
// app/api/v1/tests/[id]/route.ts
import { NextRequest } from 'next/server';
import { withAuth } from '@/app/api/_lib/middleware/auth';
import { APIResponseBuilder } from '@/app/api/_lib/utils/response';
import { TestService } from '@/core/services/test-service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, async () => {
    const testService = TestService.getInstance();
    const test = await testService.getTestById(params.id);
    
    if (!test) {
      return APIResponseBuilder.error({
        code: 'NOT_FOUND',
        message: '测试不存在',
        status: 404
      });
    }

    return APIResponseBuilder.success(test);
  });
}
```

## 2. 服务层集成

### 2.1 服务实现
```typescript
// src/core/services/test-service.ts
import { DataServiceFactory } from './data-service-factory';
import { IDataService } from './data-service-interface';
import { Test, CreateTestDTO } from '@/core/types';

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
    try {
      return await this.dataService.getTests();
    } catch (error) {
      console.error('获取测试列表失败:', error);
      throw new Error('获取测试列表失败');
    }
  }

  async getTestById(id: string): Promise<Test | null> {
    try {
      return await this.dataService.getTestById(id);
    } catch (error) {
      console.error(`获取测试(${id})失败:`, error);
      throw new Error('获取测试详情失败');
    }
  }

  async createTest(data: CreateTestDTO): Promise<Test> {
    try {
      return await this.dataService.createTest(data);
    } catch (error) {
      console.error('创建测试失败:', error);
      throw new Error('创建测试失败');
    }
  }
}
```

### 2.2 数据服务接口
```typescript
// src/core/services/data-service-interface.ts
import { Test, CreateTestDTO } from '@/core/types';

export interface IDataService {
  getTests(): Promise<Test[]>;
  getTestById(id: string): Promise<Test | null>;
  createTest(data: CreateTestDTO): Promise<Test>;
  updateTest(id: string, data: Partial<Test>): Promise<Test>;
  deleteTest(id: string): Promise<void>;
}
```

## 3. React Hooks 集成

### 3.1 API Hook
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

### 3.2 测试相关 Hook
```typescript
// src/core/hooks/useTest.ts
import { useCallback } from 'react';
import { useApi } from './useApi';
import { TestService } from '@/core/services/test-service';
import type { Test, CreateTestDTO } from '@/core/types';

export function useTest() {
  const testService = TestService.getInstance();

  const {
    data: tests,
    loading: loadingTests,
    error: testsError,
    execute: fetchTests
  } = useApi(() => testService.getTests());

  const {
    data: test,
    loading: loadingTest,
    error: testError,
    execute: fetchTest
  } = useApi((id: string) => testService.getTestById(id));

  const createTest = useCallback(async (data: CreateTestDTO) => {
    try {
      const result = await testService.createTest(data);
      await fetchTests();
      return result;
    } catch (error) {
      console.error('创建测试失败:', error);
      throw error;
    }
  }, [fetchTests]);

  return {
    tests,
    loadingTests,
    testsError,
    fetchTests,
    test,
    loadingTest,
    testError,
    fetchTest,
    createTest
  };
}
```

## 4. 组件实现示例

### 4.1 测试列表组件
```typescript
// src/components/TestList.tsx
import { useEffect } from 'react';
import { useTest } from '@/core/hooks/useTest';

export function TestList() {
  const {
    tests,
    loadingTests,
    testsError,
    fetchTests
  } = useTest();

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  if (loadingTests) return <div>加载中...</div>;
  if (testsError) return <div>错误: {testsError.message}</div>;

  return (
    <ul>
      {tests?.map(test => (
        <li key={test.id}>{test.name}</li>
      ))}
    </ul>
  );
}
```

### 4.2 测试创建组件
```typescript
// src/components/CreateTest.tsx
import { useState } from 'react';
import { useTest } from '@/core/hooks/useTest';
import type { CreateTestDTO } from '@/core/types';

export function CreateTest() {
  const { createTest } = useTest();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (data: CreateTestDTO) => {
    try {
      setLoading(true);
      await createTest(data);
      // 重置表单或显示成功消息
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={/* 处理表单提交 */}>
      {/* 表单内容 */}
      {error && <div>错误: {error.message}</div>}
      <button type="submit" disabled={loading}>
        {loading ? '创建中...' : '创建测试'}
      </button>
    </form>
  );
}
```

## 5. 最佳实践

### 5.1 错误处理
- 在服务层捕获具体错误并转换为业务错误
- 在API层统一处理错误响应格式
- 在UI层优雅地展示错误信息
- 使用专门的错误类型区分不同错误

### 5.2 数据加载状态
- 使用loading状态控制UI展示
- 实现骨架屏或加载指示器
- 避免重复请求
- 实现数据缓存策略

### 5.3 类型安全
- 使用TypeScript定义完整的类型
- 确保API请求和响应类型一致
- 使用Zod进行运行时类型验证
- 在服务层保持类型安全

### 5.4 代码组织
- 遵循单一职责原则
- 使用依赖注入模式
- 保持代码模块化
- 编写完整的测试用例 