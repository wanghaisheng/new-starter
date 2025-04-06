/**
 * 数据库错误类
 * 用于标准化数据库操作中的错误处理
 */
export class DatabaseError extends Error {
  /**
   * 错误代码
   */
  code: string;
  
  /**
   * 错误详情
   */
  details?: any;
  
  /**
   * 构造函数
   * @param message 错误消息
   * @param code 错误代码
   * @param details 错误详情
   */
  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
    
    // 确保正确的原型链
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
  
  /**
   * 获取格式化的错误消息
   * @returns 格式化的错误消息
   */
  getFormattedMessage(): string {
    return `[${this.code}] ${this.message}`;
  }
  
  /**
   * 获取详细的错误信息
   * @returns 详细的错误信息，包括代码、消息和详情
   */
  getDetailedInfo(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack
    };
  }

  /**
   * 创建连接错误
   */
  static connectionError(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, 'DB_CONNECTION_ERROR', details);
  }

  /**
   * 创建查询错误
   */
  static queryError(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, 'DB_QUERY_ERROR', details);
  }

  /**
   * 创建事务错误
   */
  static transactionError(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, 'DB_TRANSACTION_ERROR', details);
  }

  /**
   * 创建迁移错误
   */
  static migrationError(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, 'DB_MIGRATION_ERROR', details);
  }

  /**
   * 创建同步错误
   */
  static syncError(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, 'DB_SYNC_ERROR', details);
  }

  /**
   * 创建验证错误
   */
  static validationError(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, 'DB_VALIDATION_ERROR', details);
  }

  /**
   * 创建权限错误
   */
  static permissionError(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, 'DB_PERMISSION_ERROR', details);
  }

  /**
   * 创建不存在错误
   */
  static notFoundError(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, 'DB_NOT_FOUND_ERROR', details);
  }

  /**
   * 创建冲突错误
   */
  static conflictError(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, 'DB_CONFLICT_ERROR', details);
  }

  /**
   * 创建超时错误
   */
  static timeoutError(message: string, details?: any): DatabaseError {
    return new DatabaseError(message, 'DB_TIMEOUT_ERROR', details);
  }
}

/**
 * 数据库错误代码枚举
 */
export enum DatabaseErrorCode {
  // 一般错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',
  INVALID_CLIENT_TYPE = 'INVALID_CLIENT_TYPE',
  
  // 数据访问错误
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INVALID_DATA = 'INVALID_DATA',
  
  // 事务错误
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  NO_ACTIVE_TRANSACTION = 'NO_ACTIVE_TRANSACTION',
  TRANSACTION_COMMIT_ERROR = 'TRANSACTION_COMMIT_ERROR',
  TRANSACTION_ROLLBACK_ERROR = 'TRANSACTION_ROLLBACK_ERROR',
  
  // 查询错误
  QUERY_ERROR = 'QUERY_ERROR',
  INVALID_QUERY = 'INVALID_QUERY',
  
  // 客户端状态错误
  CLIENT_NOT_INITIALIZED = 'CLIENT_NOT_INITIALIZED',
  CLIENT_ALREADY_INITIALIZED = 'CLIENT_ALREADY_INITIALIZED',
  
  // 同步错误
  SYNC_ERROR = 'SYNC_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  
  // 权限错误
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // 特定客户端错误
  FIREBASE_ERROR = 'FIREBASE_ERROR',
  INDEXEDDB_ERROR = 'INDEXEDDB_ERROR',
  SQLITE_ERROR = 'SQLITE_ERROR',
}

/**
 * 创建数据库错误的工厂函数
 * @param code 错误代码
 * @param message 错误消息
 * @param details 错误详情
 * @returns DatabaseError 实例
 */
export function createDatabaseError(code: string | DatabaseErrorCode, message: string, details?: any): DatabaseError {
  return new DatabaseError(message, code, details);
}