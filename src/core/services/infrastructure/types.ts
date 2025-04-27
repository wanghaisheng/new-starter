// --- Infrastructure Service Types ---
/**
 * 基础设施服务类型
 */
export enum InfrastructureServiceType {
  NETWORK = 'network',
  LOGGER = 'logger',
  EMAIL = 'email',
  CONFIG = 'config',
}

// --- Environment Type ---
/**
 * 环境
 */
import { EnvStage } from '@/core/lib/db/types/common';

export type Environment = EnvStage;

// --- ServiceConfig ---
/**
 * 服务配置
 */
export interface ServiceConfig {
  id: string;
  type: string;
  [key: string]: any;
}

// --- IService ---
/**
 * 服务接口
 */
export interface IService {
  /**
   * 初始化服务
   */
  initialize(): Promise<void>;

  /**
   * 销毁服务
   */
  dispose(): Promise<void>;

  /**
   * 是否初始化
   */
  isInitialized(): boolean;
}

// --- Infrastructure Service Config ---
/**
 * 基础设施服务配置
 */
export interface InfrastructureServiceConfig extends ServiceConfig {
  /**
   * 网络服务配置
   */
  network?: {
    baseUrl?: string;
    timeout?: number;
    headers?: Record<string, string>;
    interceptors?: RequestInterceptor[];
  };

  /**
   * 日志服务配置
   */
  logger?: {
    level?: LogLevel;
    prefix?: string;
  };

  /**
   * 邮件服务配置
   */
  email?: {
    provider?: string;
    apiKey?: string;
    from?: string;
  };

  /**
   * 配置服务配置
   */
  config?: {
    // TODO: 配置服务配置
  };
}

// --- Infrastructure Service Interface ---
/**
 * 基础设施服务接口
 */
export interface IInfrastructureService extends IService {
  /**
   * 获取服务类型
   */
  getServiceType(): InfrastructureServiceType;

  /**
   * 获取服务配置
   */
  getConfig(): InfrastructureServiceConfig;
}

// --- Network Service Interface ---
/**
 * 网络服务接口
 */
export interface INetworkService extends IInfrastructureService {
  /**
   * 发送请求
   */
  request<T>(options: RequestOptions): Promise<Response<T>>;

  /**
   * GET 请求
   */
  get<T>(url: string, options?: RequestOptions): Promise<Response<T>>;

  /**
   * POST 请求
   */
  post<T>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>>;

  /**
   * PUT 请求
   */
  put<T>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>>;

  /**
   * DELETE 请求
   */
  delete<T>(url: string, options?: RequestOptions): Promise<Response<T>>;

  /**
   * 添加拦截器
   */
  addInterceptor(interceptor: RequestInterceptor): void;

  /**
   * 移除拦截器
   */
  removeInterceptor(interceptor: RequestInterceptor): void;
}

// --- Logger Service Interface ---
/**
 * 日志服务接口
 */
export interface ILoggerService {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

// --- Email Service Interface ---
/**
 * 邮件服务接口
 */
export interface IEmailService extends IInfrastructureService {
  /**
   * 发送邮件
   */
  sendEmail(options: EmailOptions): Promise<void>;
}

/**
 * 邮件选项
 */
export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
  cc?: string;
  bcc?: string;
}

// --- Config Service Interface ---
/**
 * 配置服务接口
 */
export interface IConfigService extends IInfrastructureService {
  /**
   * 获取配置
   */
  get<T = any>(key: string): T | undefined;

  /**
   * 设置配置
   */
  set<T = any>(key: string, value: T): void;

  /**
   * 是否存在配置
   */
  has(key: string): boolean;

  /**
   * 移除配置
   */
  remove(key: string): void;
}

// --- LogLevel Enum ---
/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// --- Request/Response Types ---
/**
 * 请求选项
 */
export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retry?: number;
  url?: string;
}

/**
 * 响应对象
 */
export interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestOptions;
}

// --- Request Interceptor ---
/**
 * 请求拦截器
 */
export interface RequestInterceptor {
  onRequest(config: RequestOptions): RequestOptions | Promise<RequestOptions>;
  onResponse<T = any>(response: Response<T>): Response<T> | Promise<Response<T>>;
  onError(error: any): any;
}

// --- IServiceFactory 泛型接口（如需扩展工厂模式）---
/**
 * 服务工厂接口
 */
export interface IServiceFactory<T = any> {
  /**
   * 创建服务
   */
  createService(config: ServiceConfig): T;

  /**
   * 获取服务
   */
  getService(id: string): T | undefined;

  /**
   * 销毁服务
   */
  disposeService(id: string): void;

  /**
   * 销毁所有服务
   */
  disposeAll(): void;
}