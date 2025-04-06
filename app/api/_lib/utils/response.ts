import { NextResponse } from 'next/server';

interface ErrorResponse {
  code: string;
  message: string;
  status: number;
  details?: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    status?: number;
  };
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
  };
}

export class APIResponseBuilder {
  static success<T>(data: T, options: { status?: number } = {}) {
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: options.status || 200 }
    );
  }

  static error(error: ErrorResponse) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status }
    );
  }
}

export function handleApiError(error: unknown, defaultMessage: string) {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return APIResponseBuilder.error({
      code: 'SERVER_ERROR',
      message: error.message,
      status: 500
    });
  }
  
  return APIResponseBuilder.error({
    code: 'SERVER_ERROR',
    message: defaultMessage,
    status: 500
  });
} 