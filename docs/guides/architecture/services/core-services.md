# Core Services

## Overview

Core services are the fundamental building blocks of the HeyTCM architecture, providing essential functionality that other services and components depend on. These services are designed to be highly reliable, performant, and maintainable.

## Authentication Service

### Overview
The authentication service manages user authentication and authorization, supporting multiple authentication providers and methods.

### Core Features
- User authentication (email/password, social login, OAuth)
- Token management (JWT, refresh tokens)
- Session management
- Role-based access control
- Multi-factor authentication

### Implementation
```typescript
interface IAuthService {
  login(credentials: Credentials): Promise<AuthToken>;
  logout(token: string): Promise<void>;
  refreshToken(token: string): Promise<AuthToken>;
  verifyToken(token: string): Promise<boolean>;
  getCurrentUser(): Promise<User>;
}

class AuthService implements IAuthService {
  private adapter: AuthServiceAdapter;

  constructor(adapter: AuthServiceAdapter) {
    this.adapter = adapter;
  }

  async login(credentials: Credentials): Promise<AuthToken> {
    try {
      return await this.adapter.login(credentials);
    } catch (error) {
      throw new ServiceError('AUTH_FAILED', 'Authentication failed', 401);
    }
  }

  // ... other methods
}
```

## User Management Service

### Overview
The user management service handles user-related operations, including creation, retrieval, updates, and deletion of user accounts.

### Core Features
- User CRUD operations
- Profile management
- Account settings
- User preferences
- Account recovery

### Implementation
```typescript
interface IUserService {
  createUser(user: UserDTO): Promise<User>;
  getUser(id: string): Promise<User>;
  updateUser(id: string, user: UserDTO): Promise<User>;
  deleteUser(id: string): Promise<void>;
  searchUsers(query: string): Promise<User[]>;
}

class UserService implements IUserService {
  private adapter: UserServiceAdapter;

  constructor(adapter: UserServiceAdapter) {
    this.adapter = adapter;
  }

  async createUser(user: UserDTO): Promise<User> {
    try {
      return await this.adapter.createUser(user);
    } catch (error) {
      throw new ServiceError('USER_CREATION_FAILED', 'Failed to create user', 500);
    }
  }

  // ... other methods
}
```

## Data Service

### Overview
The data service provides a unified interface for data access and manipulation, abstracting the underlying data storage implementation.

### Core Features
- Data CRUD operations
- Query optimization
- Data validation
- Transaction management
- Data caching

### Implementation
```typescript
interface IDataService {
  create<T>(collection: string, data: T): Promise<T>;
  read<T>(collection: string, id: string): Promise<T>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<T>;
  delete(collection: string, id: string): Promise<void>;
  query<T>(collection: string, query: Query): Promise<T[]>;
}

class DataService implements IDataService {
  private adapter: DataServiceAdapter;

  constructor(adapter: DataServiceAdapter) {
    this.adapter = adapter;
  }

  async create<T>(collection: string, data: T): Promise<T> {
    try {
      return await this.adapter.create(collection, data);
    } catch (error) {
      throw new ServiceError('DATA_CREATION_FAILED', 'Failed to create data', 500);
    }
  }

  // ... other methods
}
```

## Storage Service

### Overview
The storage service manages file and object storage, supporting multiple storage providers and configurations.

### Core Features
- File upload/download
- Object storage
- File metadata management
- Storage optimization
- Backup and recovery

### Implementation
```typescript
interface IStorageService {
  upload(file: File, options: UploadOptions): Promise<StorageResult>;
  download(path: string): Promise<File>;
  delete(path: string): Promise<void>;
  getMetadata(path: string): Promise<FileMetadata>;
  listFiles(prefix: string): Promise<FileList>;
}

class StorageService implements IStorageService {
  private adapter: StorageServiceAdapter;

  constructor(adapter: StorageServiceAdapter) {
    this.adapter = adapter;
    }
    
  async upload(file: File, options: UploadOptions): Promise<StorageResult> {
    try {
      return await this.adapter.upload(file, options);
    } catch (error) {
      throw new ServiceError('UPLOAD_FAILED', 'Failed to upload file', 500);
    }
  }

  // ... other methods
}
```

## Best Practices

### 1. Service Design
- Keep services focused and single-responsibility
- Use interfaces for service contracts
- Implement proper error handling
- Document service behavior

### 2. Performance
- Implement caching where appropriate
- Use asynchronous operations
- Optimize database queries
- Monitor service metrics

### 3. Security
- Validate all input
- Sanitize all output
- Implement proper authentication
- Follow security best practices

### 4. Testing
- Unit test service logic
- Test adapter implementations
- Integration test service interactions
- Test environment switching

### 5. Error Handling
- Use consistent error types
- Provide meaningful error messages
- Log errors appropriately
- Handle errors gracefully

## Related Documentation

- [Service Layer Architecture](overview.md)
- [Authentication Services](auth-services.md)
- [Data Services](data-services.md)
- [Storage Services](storage-services.md)
- [Error Handling](error-handling.md)
- [Testing](testing.md) 