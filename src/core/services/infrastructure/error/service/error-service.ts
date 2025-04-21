// error-service.ts
import { ErrorLevel, IErrorService, ErrorServiceType } from '@/core/services/infrastructure/error/types/error-types';
import type { InfrastructureServiceConfig } from '@/core/services/infrastructure/types';

/**
 * ErrorService - 全局错误捕获与上报基础设施服务
 * 支持本地处理、远程上报、用户友好提示、全局异常监听等
 */

export class ErrorService implements IErrorService {
  private static instance: ErrorService;
  private config: InfrastructureServiceConfig = { id: 'error', type: ErrorServiceType.ERROR };
  private _isInitialized = false;
  private errorLevel: ErrorLevel = 'ERROR';
  private handler?: (error: Error | unknown, context?: any) => void;

  private constructor() {}

  async initialize(): Promise<void> {
    this._isInitialized = true;
    // 可选：注册全局异常监听
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (e) => this.capture(e.error || e, { global: true }));
      window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => this.capture(e.reason, { global: true }));
    }
  }

  async dispose(): Promise<void> {
    this._isInitialized = false;
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  setLevel(level: ErrorLevel): void {
    this.errorLevel = level;
  }

  capture(error: Error | unknown, context?: any): void {
    if (this.handler) {
      this.handler(error, context);
    } else {
      // 默认行为：本地 log
      // eslint-disable-next-line no-console
      console.error('[ErrorService] 捕获错误:', error, context);
    }
  }

  async report(error: Error | unknown, context?: any): Promise<void> {
    // 可扩展：远程上报（如 sentry、datadog、阿里云等）
    // 这里只做本地 log
    // eslint-disable-next-line no-console
    console.error('[ErrorService] 上报错误:', error, context);
  }

  showUserError(message: string, options?: { toast?: boolean; dialog?: boolean }): void {
    // 可扩展：调用全局 toast/dialog 组件
    // eslint-disable-next-line no-alert
    if (options?.toast) {
      // TODO: 触发全局 toast
      console.warn('[ErrorService] Toast:', message);
    } else if (options?.dialog) {
      alert(message);
    } else {
      // 默认 fallback
      console.warn('[ErrorService] 用户错误:', message);
    }
  }

  setHandler(handler: (error: Error | unknown, context?: any) => void): void {
    this.handler = handler;
  }

  getServiceType(): ErrorServiceType {
    return ErrorServiceType.ERROR;
  }

  getConfig(): InfrastructureServiceConfig {
    return this.config;
  }

  static getInstance(): ErrorService {
    if (!ErrorService.instance) ErrorService.instance = new ErrorService();
    return ErrorService.instance;
  }
}
