import { NextRequest } from 'next/server';

// API 请求上下文
export interface ApiContext {
  req: NextRequest;
  params?: Record<string, string>;
  searchParams?: URLSearchParams;
}

// API 路由处理器
export type ApiHandler<T = any> = (context: ApiContext) => Promise<T>;

// API 中间件
export type ApiMiddleware = (
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
) => Promise<Response>;

// API 响应格式
export interface ApiResponse<T = any> {
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

// API 错误类型
export type ApiError = {
  code: string;
  message: string;
  status: number;
  details?: any;
};

// API 配置
export interface ApiConfig {
  // 认证配置
  auth?: {
    required?: boolean;
    roles?: string[];
  };
  // 速率限制配置
  rateLimit?: {
    windowMs: number;
    max: number;
    message?: string;
  };
  // 错误处理配置
  errorHandler?: {
    logErrors?: boolean;
    includeStackTrace?: boolean;
  };
  // 缓存配置
  cache?: {
    enabled?: boolean;
    maxAge?: number;
    staleWhileRevalidate?: number;
  };
}

// API 路由配置
export interface ApiRouteConfig extends ApiConfig {
  // 路由处理器
  handler: ApiHandler;
  // 中间件
  middleware?: ApiMiddleware[];
  // 请求方法
  methods?: string[];
  // 路径参数验证
  params?: Record<string, string>;
  // 查询参数验证
  query?: Record<string, string>;
  // 请求体验证
  body?: Record<string, any>;
}

// API 版本
export type ApiVersion = 'v1' | 'v2';

// API 环境
export type ApiEnvironment = 'development' | 'staging' | 'production';

// API 平台
export type ApiPlatform = 'web' | 'mobile' | 'desktop'; 