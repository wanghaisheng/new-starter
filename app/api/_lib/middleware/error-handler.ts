import { NextRequest, NextResponse } from 'next/server';
import { APIResponseBuilder } from '../utils/response';

interface ErrorHandlerConfig {
  logErrors?: boolean;
  includeStackTrace?: boolean;
}

const defaultConfig: ErrorHandlerConfig = {
  logErrors: process.env.NODE_ENV !== 'production',
  includeStackTrace: process.env.NODE_ENV !== 'production'
};

// Firebase 错误类型
interface FirebaseError extends Error {
  code: string;
  message: string;
  stack?: string;
}

function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as any).code === 'string'
  );
}

export async function withErrorHandler(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: ErrorHandlerConfig = defaultConfig
): Promise<NextResponse> {
  try {
    return await handler(req);
  } catch (error) {
    if (config.logErrors) {
      console.error('API Error:', {
        url: req.url,
        method: req.method,
        error
      });
    }

    // 处理已知错误类型
    if (error instanceof APIError) {
      return APIResponseBuilder.error({
        code: error.code,
        message: error.message,
        status: error.status,
        details: config.includeStackTrace ? error.stack : undefined
      });
    }

    // 处理 Firebase 错误
    if (isFirebaseError(error)) {
      return APIResponseBuilder.error({
        code: error.code,
        message: error.message,
        status: 500,
        details: config.includeStackTrace ? error.stack : undefined
      });
    }

    // 处理验证错误
    if (error instanceof ValidationError) {
      return APIResponseBuilder.error({
        code: 'VALIDATION_ERROR',
        message: error.message,
        status: 400,
        details: error.details
      });
    }

    // 处理其他未知错误
    return APIResponseBuilder.error({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      status: 500,
      details: config.includeStackTrace ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
}

// 自定义错误类
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
} 