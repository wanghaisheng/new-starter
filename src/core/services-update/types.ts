/**
 * 服务工厂接口
 */
export interface IServiceFactory<T extends IService> {
  createService(config: ServiceConfig): T;
  getService(): T | null;
  disposeService(): Promise<void>;
}

/**
 * 服务注册表接口
 */
export interface IServiceRegistry<T extends IService> {
  registerProvider(type: string, provider: new (config: ServiceConfig) => T): void;
  unregisterProvider(type: string): void;
  getProvider(type: string): (new (config: ServiceConfig) => T) | null;
  createService(type: string, config: ServiceConfig): T;
}

/**
 * 服务配置
 */
export interface ServiceConfig {
  environment: 'development' | 'production' | 'test';
  services: {
    [key: string]: {
      adapter: string;
      options?: {
        network?: {
          baseUrl?: string;
          timeout?: number;
          headers?: Record<string, string>;
          interceptors?: any[];
        };
        logger?: {
          level?: string;
          prefix?: string;
        };
      };
    };
  };
  options?: Record<string, any>;
}

/**
 * 服务接口
 */
export interface IService {
  initialize(config?: ServiceConfig): Promise<void>;
  dispose(): Promise<void>;
  getType(): string;
  isInitialized(): boolean;
  getConfig(): ServiceConfig;
}

/**
 * 服务错误
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * 服务状态
 */
export enum ServiceStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DISPOSED = 'disposed'
}

/**
 * 服务事件
 */
export enum ServiceEvent {
  INITIALIZED = 'initialized',
  ERROR = 'error',
  DISPOSED = 'disposed'
}

/**
 * 服务事件监听器
 */
export type ServiceEventListener = (event: ServiceEvent, data?: any) => void; 