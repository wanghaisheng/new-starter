import { ILoggerService, InfrastructureServiceConfig, LogLevel, InfrastructureServiceType } from '../../types';
import { logger as winstonLogger } from '@/core/lib/logger';

/**
 * 日志服务类
 * 负责处理日志记录
 */
export class LoggerService implements ILoggerService {
  private static instance: LoggerService;
  private config: InfrastructureServiceConfig;
  private _isInitialized = false;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {
    this.config = this.getEnvironmentConfig();
  }

  /**
   * 获取服务实例
   */
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (!this._isInitialized) {
      this._isInitialized = true;
      winstonLogger.info('Logger service initialized');
    }
  }

  /**
   * 释放服务资源
   */
  async dispose(): Promise<void> {
    this._isInitialized = false;
    winstonLogger.info('Logger service disposed');
  }

  /**
   * 检查服务是否已初始化
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.logLevel = level;
    // Winston logger level is set during creation
  }

  /**
   * 记录调试日志
   */
  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      winstonLogger.debug(message, ...args);
    }
  }

  /**
   * 记录信息日志
   */
  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      winstonLogger.info(message, ...args);
    }
  }

  /**
   * 记录警告日志
   */
  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      winstonLogger.warn(message, ...args);
    }
  }

  /**
   * 记录错误日志
   */
  error(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      winstonLogger.error(message, ...args);
    }
  }

  /**
   * 获取服务类型
   */
  getServiceType(): InfrastructureServiceType {
    return InfrastructureServiceType.LOGGER;
  }

  /**
   * 获取服务类型
   */
  getType(): string {
    return 'logger';
  }

  /**
   * 获取服务配置
   */
  getConfig(): InfrastructureServiceConfig {
    return this.config;
  }

  private getEnvironmentConfig(): InfrastructureServiceConfig {
    const env = process.env.NODE_ENV || 'development';
    return {
      environment: env,
      services: {
        [env]: {
          adapter: 'winston',
          options: {
            logger: {
              level: this.logLevel,
              prefix: 'LoggerService'
            }
          }
        }
      }
    };
  }
} 