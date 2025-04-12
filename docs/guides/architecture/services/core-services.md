# Core Services Documentation

## Overview

Core services provide fundamental functionality required across the HeyTCM application. These services are essential building blocks that other services and components depend on.

## Service Catalog

### 1. User Service

The User Service manages user-related operations and data.

```typescript
interface IUserService {
  // User Management
  createUser(userData: UserDTO): Promise<User>;
  getUser(id: string): Promise<User>;
  updateUser(id: string, userData: UserDTO): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Profile Management
  updateProfile(id: string, profile: ProfileDTO): Promise<Profile>;
  getProfile(id: string): Promise<Profile>;
  
  // Preferences
  updatePreferences(id: string, preferences: PreferencesDTO): Promise<Preferences>;
  getPreferences(id: string): Promise<Preferences>;
}
```

### 2. Authentication Service

Handles user authentication and session management.

```typescript
interface IAuthService {
  // Authentication
  login(credentials: Credentials): Promise<AuthToken>;
  logout(token: string): Promise<void>;
  refreshToken(token: string): Promise<AuthToken>;
  
  // Session Management
  validateSession(token: string): Promise<boolean>;
  getSessionUser(token: string): Promise<User>;
  
  // Security
  resetPassword(email: string): Promise<void>;
  changePassword(token: string, newPassword: string): Promise<void>;
}
```

### 3. Authorization Service

Manages access control and permissions.

```typescript
interface IAuthorizationService {
  // Permission Management
  checkPermission(userId: string, permission: string): Promise<boolean>;
  grantPermission(userId: string, permission: string): Promise<void>;
  revokePermission(userId: string, permission: string): Promise<void>;
  
  // Role Management
  assignRole(userId: string, role: string): Promise<void>;
  removeRole(userId: string, role: string): Promise<void>;
  getRoles(userId: string): Promise<string[]>;
}
```

### 4. Notification Service

Handles system notifications and user alerts.

```typescript
interface INotificationService {
  // Notification Management
  sendNotification(userId: string, notification: NotificationDTO): Promise<void>;
  getNotifications(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  
  // Push Notifications
  sendPushNotification(deviceToken: string, message: PushMessage): Promise<void>;
  registerDevice(userId: string, deviceInfo: DeviceInfo): Promise<void>;
}
```

## Implementation Details

### 1. Service Dependencies

```typescript
class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService,
    private notificationService: INotificationService,
    private logger: ILogger
  ) {}
}
```

### 2. Error Handling

```typescript
class UserServiceError extends ServiceError {
  static USER_NOT_FOUND = new UserServiceError(
    'USER_NOT_FOUND',
    'User not found',
    404
  );
  
  static INVALID_USER_DATA = new UserServiceError(
    'INVALID_USER_DATA',
    'Invalid user data provided',
    400
  );
}
```

### 3. Data Validation

```typescript
class UserValidator {
  static validateUserData(userData: UserDTO): void {
    if (!userData.email || !userData.password) {
      throw UserServiceError.INVALID_USER_DATA;
    }
    
    if (!this.isValidEmail(userData.email)) {
      throw UserServiceError.INVALID_USER_DATA;
    }
  }
}
```

## Best Practices

### 1. Service Implementation

1. **Interface First**
   - Define clear interfaces
   - Document all methods
   - Include error cases
   - Specify return types

2. **Error Handling**
   - Use custom error types
   - Include error codes
   - Provide meaningful messages
   - Log errors appropriately

3. **Data Validation**
   - Validate all input
   - Sanitize data
   - Use type checking
   - Implement business rules

### 2. Performance Optimization

1. **Caching**
   - Cache frequently accessed data
   - Implement cache invalidation
   - Use appropriate cache strategies
   - Monitor cache hit rates

2. **Database Optimization**
   - Use indexes appropriately
   - Optimize queries
   - Implement pagination
   - Use connection pooling

### 3. Security

1. **Authentication**
   - Use secure password hashing
   - Implement rate limiting
   - Use secure tokens
   - Validate sessions

2. **Authorization**
   - Implement role-based access
   - Use permission checks
   - Validate user context
   - Audit access

## Testing

### 1. Unit Tests

```typescript
describe('UserService', () => {
  let userService: IUserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  
  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    
    userService = new UserService(
      mockUserRepository,
      mockAuthService,
      mockNotificationService,
      mockLogger
    );
  });
  
  test('createUser should create a new user', async () => {
    const userData: UserDTO = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    await userService.createUser(userData);
    
    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: userData.email
      })
    );
  });
});
```

### 2. Integration Tests

```typescript
describe('UserService Integration', () => {
  let userService: IUserService;
  let authService: IAuthService;
  
  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase();
    
    userService = new UserService(
      new UserRepository(),
      new AuthService(),
      new NotificationService(),
      new Logger()
    );
  });
  
  test('should create user and authenticate', async () => {
    const userData: UserDTO = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const user = await userService.createUser(userData);
    const token = await authService.login({
      email: userData.email,
      password: userData.password
    });
    
    expect(token).toBeDefined();
    expect(await authService.validateSession(token)).toBe(true);
  });
});
```

## Related Documentation

- [Service Layer Overview](overview.md)
- [Data Services](data-services.md)
- [Authentication Services](auth-services.md)
- [Error Handling](error-handling.md)
- [Testing](testing.md) 