/**
 * 数据库错误类
 * 用于表示数据库操作中的错误
 */
export class DatabaseError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;

    // 确保原型链正确
    Object.setPrototypeOf(this, DatabaseError.prototype);
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