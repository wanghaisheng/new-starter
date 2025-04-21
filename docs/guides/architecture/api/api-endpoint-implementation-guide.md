# API Endpoint Implementation Guide

## Overview

This guide outlines the implementation standards for API endpoints in the HeyTCM architecture. The API layer serves as the interface between the client applications and the service layer, following RESTful principles and implementing consistent patterns for request handling, response formatting, and error management.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│     Client      │────▶│      API        │────▶│    Service      │
│                 │     │    Layer        │     │    Layer        │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Implementation Standards

### 1. Endpoint Structure

```typescript
// app/api/[service]/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getService } from '@/core/services/factory';
import { validateRequest } from '@/core/utils/validation';
import { handleError } from '@/core/utils/error';

export async function GET(req: NextRequest) {
  try {
    // 1. 获取服务实例
    const service = await getService('serviceName');
    
    // 2. 验证请求
    const validatedData = await validateRequest(req);
    
    // 3. 调用服务方法
    const result = await service.method(validatedData);
    
    // 4. 返回响应
    return NextResponse.json(result);
  } catch (error) {
    // 5. 错误处理
    return handleError(error);
  }
}
```

### 2. Request Validation

```typescript
// core/utils/validation.ts
import { z } from 'zod';

export const validateRequest = async (req: NextRequest) => {
  // 1. 解析请求体
  const body = await req.json();
  
  // 2. 定义验证模式
  const schema = z.object({
    // 字段定义
  });
  
  // 3. 验证数据
  return schema.parse(body);
};
```

### 3. Error Handling

```typescript
// core/utils/error.ts
export const handleError = (error: unknown) => {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
    }
  
  // 处理其他类型的错误
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
};
```

### 4. Response Format

```typescript
// 成功响应
{
  "data": {
    // 响应数据
  },
  "metadata": {
    "timestamp": "2024-04-14T12:00:00Z",
    "requestId": "req_123"
  }
}

// 错误响应
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {
      // 错误详情
    }
  },
  "metadata": {
    "timestamp": "2024-04-14T12:00:00Z",
    "requestId": "req_123"
  }
}
```

## Best Practices

### 1. Endpoint Design
- Use RESTful conventions for URL structure
- Implement proper HTTP methods (GET, POST, PUT, DELETE)
- Version APIs appropriately
- Document endpoints using OpenAPI/Swagger

### 2. Security
- Implement authentication middleware
- Validate all input data
- Sanitize output data
- Use HTTPS
- Implement rate limiting

### 3. Performance
- Implement caching where appropriate
- Use pagination for large datasets
- Optimize database queries
- Monitor API performance

### 4. Error Handling
- Use consistent error formats
- Provide meaningful error messages
- Log errors appropriately
- Implement retry mechanisms

### 5. Testing
- Write unit tests for endpoints
- Test error scenarios
- Validate response formats
- Test performance under load

## Example Implementation

### 1. User Endpoint

```typescript
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getService } from '@/core/services/factory';
import { validateRequest } from '@/core/utils/validation';
import { handleError } from '@/core/utils/error';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
    try {
    const userService = await getService('user');
    const user = await userService.getUser(params.id);
    return NextResponse.json({ data: user });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userService = await getService('user');
    const data = await validateRequest(req);
    const user = await userService.updateUser(params.id, data);
    return NextResponse.json({ data: user });
    } catch (error) {
    return handleError(error);
  }
}
```

### 2. Authentication Endpoint

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getService } from '@/core/services/factory';
import { validateRequest } from '@/core/utils/validation';
import { handleError } from '@/core/utils/error';

export async function POST(req: NextRequest) {
  try {
    const authService = await getService('auth');
    const credentials = await validateRequest(req);
    const token = await authService.login(credentials);
    return NextResponse.json({ data: token });
  } catch (error) {
    return handleError(error);
  }
}
```

## Related Documentation

- [Service Layer Architecture](../services/overview.md)
- [Authentication Services](../services/auth-services.md)
- [Error Handling](../services/error-handling.md)
- [Testing](../testing/README.md) 