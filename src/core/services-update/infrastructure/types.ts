import { IService, ServiceConfig } from '../types';

/**
 * 基础设施服务类型
 */
export enum InfrastructureServiceType {
  NETWORK = 'network',
  LOGGER = 'logger'
}

/**
 * 环境
 */
export type Environment = 'development' | 'production' | 'test';

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
}

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

/**
 * 网络服务接口
 */
export interface INetworkService extends IInfrastructureService {
  request<T>(options: RequestOptions): Promise<Response<T>>;
  get<T>(url: string, options?: RequestOptions): Promise<Response<T>>;
  post<T>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>>;
  put<T>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>>;
  delete<T>(url: string, options?: RequestOptions): Promise<Response<T>>;
  addInterceptor(interceptor: RequestInterceptor): void;
  removeInterceptor(interceptor: RequestInterceptor): void;
}

/**
 * 日志服务接口
 */
export interface ILoggerService extends IInfrastructureService {
  setLevel(level: LogLevel): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

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
  [key: string]: any;
}

/**
 * 响应对象
 */
export interface Response<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestOptions;
}

/**
 * 请求拦截器
 */
export interface RequestInterceptor {
  onRequest?(config: RequestOptions): RequestOptions | Promise<RequestOptions>;
  onResponse?<T>(response: Response<T>): Response<T> | Promise<Response<T>>;
  onError?(error: any): any;
}

export interface IServiceFactory<T extends IService> {
  createService(config: ServiceConfig): T;
  getService(id: string): T | undefined;
  disposeService(id: string): void;
  disposeAll(): void;
}

export interface ServiceConfig {
  id: string;
  type: string;
  [key: string]: any;
} 