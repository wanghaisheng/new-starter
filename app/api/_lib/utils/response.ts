import { NextResponse } from 'next/server';

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
  static success<T>(
    data: T,
    options: { status?: number; meta?: APIResponse['meta'] } = {}
  ): NextResponse {
    const response: APIResponse<T> = {
      success: true,
      data,
      meta: options.meta
    };

    return NextResponse.json(response, { 
      status: options.status || 200 
    });
  }

  static error(error: {
    code: string;
    message: string;
    details?: any;
    status?: number;
  }): NextResponse {
    const response: APIResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };

    return NextResponse.json(response, { 
      status: error.status || 500 
    });
  }
} 