console.log('database-error loaded');

// 数据库错误类型与工厂

export enum DatabaseErrorCode {
  UNKNOWN = 'UNKNOWN',
  CLIENT_NOT_INITIALIZED = 'CLIENT_NOT_INITIALIZED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TIMEOUT = 'TIMEOUT',
  NO_ACTIVE_TRANSACTION = 'NO_ACTIVE_TRANSACTION',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',  
  UPGRADE_IN_PROGRESS = 'UPGRADE_IN_PROGRESS',
  NO_UPGRADE_IN_PROGRESS = 'NO_UPGRADE_IN_PROGRESS',
  VERSION_NOT_FOUND = 'VERSION_NOT_FOUND',
  // ...可扩展
}

export interface DatabaseError extends Error {
  code: DatabaseErrorCode | string;
  details?: any;
}

export function createDatabaseError(
  code: DatabaseErrorCode | string,
  message: string,
  details?: any
): DatabaseError {
  const error = new Error(message) as DatabaseError;
  error.name = 'DatabaseError';
  error.code = code;
  if (details) error.details = details;
  return error;
}
