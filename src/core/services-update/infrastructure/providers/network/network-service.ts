import { ServiceConfig } from '../../../types';
import { INetworkService, RequestOptions, Response, RequestInterceptor, InfrastructureServiceType, InfrastructureServiceConfig, LogLevel } from '../../types';
import { LoggerService } from '../logger/logger-service';

/**
 * 网络服务类
 * 负责处理 HTTP 请求
 */
export class NetworkService implements INetworkService {
  private static instance: NetworkService;
  private config: InfrastructureServiceConfig;
  private interceptors: RequestInterceptor[] = [];
  private logger: LoggerService;
  private _isInitialized = false;

  private constructor() {
    this.config = this.getEnvironmentConfig();
    this.logger = LoggerService.getInstance();
  }

  /**
   * 获取服务实例
   */
  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (!this._isInitialized) {
      // 初始化网络服务
      this._isInitialized = true;
    }
  }

  /**
   * 释放服务资源
   */
  async dispose(): Promise<void> {
    this._isInitialized = false;
    this.interceptors = [];
  }

  /**
   * 检查服务是否已初始化
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 获取服务类型
   */
  getType(): string {
    return InfrastructureServiceType.NETWORK;
  }

  /**
   * 获取服务类型
   */
  getServiceType(): InfrastructureServiceType {
    return InfrastructureServiceType.NETWORK;
  }

  /**
   * 获取服务配置
   */
  getConfig(): InfrastructureServiceConfig {
    return this.config;
  }

  /**
   * 发送请求
   */
  async request<T>(options: RequestOptions): Promise<Response<T>> {
    if (!this._isInitialized) {
      throw new Error('Network service not initialized');
    }

    // 处理请求拦截器
    let config = { ...options };
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        config = await interceptor.onRequest(config);
      }
    }

    // 构建完整URL
    const url = this.buildUrl(config.url || '');

    // 发送请求
    try {
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: { ...this.config.network?.headers || {}, ...config.headers },
        body: config.data ? JSON.stringify(config.data) : undefined,
      });

      // 处理响应
      const data = await response.json();
      const result: Response<T> = {
        data: data as T,
        status: response.status,
        statusText: response.statusText,
        headers: this.getHeaders(response),
        config,
      };

      // 处理响应拦截器
      let finalResult = result;
      for (const interceptor of this.interceptors) {
        if (interceptor.onResponse) {
          finalResult = await interceptor.onResponse(finalResult);
        }
      }

      return finalResult;
    } catch (error) {
      // 处理错误拦截器
      for (const interceptor of this.interceptors) {
        if (interceptor.onError) {
          return interceptor.onError(error);
        }
      }
      throw error;
    }
  }

  /**
   * GET请求
   */
  async get<T>(url: string, options?: RequestOptions): Promise<Response<T>> {
    return this.request<T>({
      ...options,
      method: 'GET',
      url,
    });
  }

  /**
   * POST请求
   */
  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>> {
    return this.request<T>({
      ...options,
      method: 'POST',
      url,
      data,
    });
  }

  /**
   * PUT请求
   */
  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<Response<T>> {
    return this.request<T>({
      ...options,
      method: 'PUT',
      url,
      data,
    });
  }

  /**
   * DELETE请求
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<Response<T>> {
    return this.request<T>({
      ...options,
      method: 'DELETE',
      url,
    });
  }

  /**
   * 添加请求拦截器
   */
  addInterceptor(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor);
  }

  /**
   * 移除请求拦截器
   */
  removeInterceptor(interceptor: RequestInterceptor): void {
    const index = this.interceptors.indexOf(interceptor);
    if (index > -1) {
      this.interceptors.splice(index, 1);
    }
  }

  /**
   * 构建完整URL
   */
  private buildUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.config.network?.baseUrl || ''}${url}`;
  }

  /**
   * 获取响应头
   */
  private getHeaders(response: globalThis.Response): Record<string, string> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  private getEnvironmentConfig(): InfrastructureServiceConfig {
    const env = process.env.NODE_ENV || 'development';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    const networkOptions = {
      baseUrl: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      interceptors: [],
    };

    const loggerOptions = {
        level: LogLevel.INFO, // Default log level
        prefix: 'NetworkServiceLogger'
    };

    const networkServiceEntry = {
        adapter: 'fetch', // Default adapter
        options: { network: networkOptions }
    };

    const loggerServiceEntry = {
        adapter: 'winston', // Default adapter
        options: { logger: loggerOptions }
    };

    return {
      environment: env,
      services: {
        [InfrastructureServiceType.NETWORK]: networkServiceEntry,
        [InfrastructureServiceType.LOGGER]: loggerServiceEntry
      },
      network: networkOptions,
      logger: loggerOptions,
      options: {} // Base options
    };
  }
} 