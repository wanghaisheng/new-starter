# Service Layer Architecture Overview

## Introduction

The service layer in HeyTCM serves as the core business logic layer, sitting between the presentation layer (UI) and the data layer (database/API). It encapsulates business rules, data transformation, and orchestration of complex operations. The service layer is designed to be environment-aware, automatically adapting to different environments (development, test, production) while maintaining a consistent interface.

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Presentation   │────▶│    Service      │────▶│      Data       │
│     Layer       │     │     Layer       │     │      Layer      │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Adapters   │
                    │  (Mock/Fire-│
                    │  base/Better)│
                    └─────────────┘
```

## Core Components

### 1. Service Types

1. **Core Services**
   - Authentication service
   - User management service
   - Data service
   - Storage service

2. **Business Services**
   - Advertising service
   - Analytics service
   - Search service
   - Map service
   - Payment service
   - Push service
   - Messaging service

3. **Utility Services**
   - Logging service
   - Caching service
   - Notification service
   - File handling service
   - AI service
   - Device service
   - Security service

### 2. Service Characteristics

1. **Stateless**
   - Services maintain no client state
   - Each request is independent
   - Scalable horizontally

2. **Reusable**
   - Services can be used by multiple clients
   - Common functionality is centralized
   - Consistent business rules

3. **Transactional**
   - ACID compliance where needed
   - Transaction boundaries clearly defined
   - Rollback capabilities

4. **Secure**
   - Authentication required
   - Authorization enforced
   - Input validation
   - Output sanitization

5. **Environment-Aware**
   - Services automatically adapt to environment
   - Single interface for all environments
   - Transparent implementation switching
   - Consistent behavior across environments

## Design Principles

### 1. Interface Segregation

```typescript
// 服务接口定义
interface IAuthService {
  login(credentials: Credentials): Promise<AuthToken>;
  logout(token: string): Promise<void>;
  refreshToken(token: string): Promise<AuthToken>;
}

interface IUserService {
  createUser(user: UserDTO): Promise<User>;
  getUser(id: string): Promise<User>;
  updateUser(id: string, user: UserDTO): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
```

### 2. Adapter Pattern

```typescript
// 适配器基类
abstract class AuthServiceAdapter implements IAuthService {
  abstract login(credentials: Credentials): Promise<AuthToken>;
  abstract logout(token: string): Promise<void>;
  abstract refreshToken(token: string): Promise<AuthToken>;
}

// 具体适配器实现
class MockAuthServiceAdapter extends AuthServiceAdapter {
  // Mock实现
}

class FirebaseAuthServiceAdapter extends AuthServiceAdapter {
  // Firebase实现
}

class BetterAuthServiceAdapter extends AuthServiceAdapter {
  // Better实现
}
```

### 3. Environment-Aware Service Factory

```typescript
class ServiceFactory {
  private static environment: 'development' | 'test' | 'production';
  private static adapters: Map<string, any> = new Map();

  static setEnvironment(env: 'development' | 'test' | 'production'): void {
    this.environment = env;
  }

  static createAuthService(): IAuthService {
    const adapter = this.getAdapter('auth');
    return new AuthService(adapter);
  }

  private static getAdapter(serviceName: string): any {
    if (!this.adapters.has(serviceName)) {
      const adapter = this.createAdapter(serviceName);
      this.adapters.set(serviceName, adapter);
    }
    return this.adapters.get(serviceName);
  }

  private static createAdapter(serviceName: string): any {
    switch (this.environment) {
      case 'development':
        return new MockAuthServiceAdapter();
      case 'test':
        return new FirebaseAuthServiceAdapter();
      case 'production':
        return new BetterAuthServiceAdapter();
      default:
        throw new Error(`Unsupported environment: ${this.environment}`);
    }
  }
}
```

### 4. Service Configuration

```typescript
interface ServiceConfig {
  environment: 'development' | 'test' | 'production';
  adapters: {
    auth: {
      mock: MockAuthConfig;
      firebase: FirebaseAuthConfig;
      better: BetterAuthConfig;
    };
    // 其他服务配置...
  };
}

class ServiceConfigManager {
  private static config: ServiceConfig;

  static initialize(config: ServiceConfig): void {
    this.config = config;
    ServiceFactory.setEnvironment(config.environment);
  }

  static getConfig(): ServiceConfig {
    return this.config;
  }
}
```

### 5. Error Handling

```typescript
class ServiceError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

// Usage
throw new ServiceError(
  'USER_NOT_FOUND',
  'User with given ID not found',
  404
);
```

## Implementation Guidelines

### 1. Service Design
- Keep services focused and single-responsibility
- Use interfaces for service contracts
- Implement proper error handling
- Document service behavior

### 2. Adapter Implementation
- Each service should have a base adapter class
- Implement environment-specific adapters
- Ensure consistent behavior across adapters
- Handle environment-specific errors

### 3. Configuration Management
- Centralize service configuration
- Support environment-specific settings
- Enable runtime configuration changes
- Validate configuration on startup

### 4. Testing
- Unit test service logic
- Test adapter implementations
- Integration test service interactions
- Test environment switching
- Mock external dependencies
- Test error scenarios

### 5. Performance
- Implement caching where appropriate
- Use asynchronous operations
- Optimize database queries
- Monitor service metrics

### 6. Security
- Validate all input
- Sanitize all output
- Implement proper authentication
- Follow security best practices

## Related Documentation

- [Core Services](core-services.md)
- [Data Services](data-services.md)
- [Authentication Services](auth-services.md)
- [Business Logic](business-logic.md)
- [Service Communication](service-communication.md)
- [Error Handling](error-handling.md)
- [Testing](testing.md) 