// winston-adapter.ts
import winston, { Logger as WinstonLogger, LoggerOptions } from 'winston';
import { LogLevel, ILoggerService, InfrastructureServiceConfig } from '@/core/services/infrastructure/logger/types/logger-types';
import { InfrastructureServiceType } from '@/core/lib/db/types/common';

/**
 * Winston 日志适配器，兼容 ILoggerService，支持多 transport、格式化、动态 level。
 * 支持扩展输出目标（如文件/远程）、格式化等高级特性。
 */
export class WinstonLoggerAdapter implements ILoggerService {
  private static instance: WinstonLoggerAdapter;
  private logger: WinstonLogger;
  private initialized = false;
  private level: LogLevel = 'INFO';

  private constructor() {
    const options: LoggerOptions = {
      level: this.level.toLowerCase(),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      ),
      transports: [new winston.transports.Console()]
    };
    this.logger = winston.createLogger(options);
  }

  static getInstance() {
    if (!WinstonLoggerAdapter.instance) {
      WinstonLoggerAdapter.instance = new WinstonLoggerAdapter();
    }
    return WinstonLoggerAdapter.instance;
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async dispose(): Promise<void> {
    this.initialized = false;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
    this.logger.level = level.toLowerCase();
  }

  debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.logger.info(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.logger.error(message, ...args);
  }

  getServiceType(): InfrastructureServiceType {
    return InfrastructureServiceType.LOGGER;
  }

  getConfig(): InfrastructureServiceConfig {
    return { id: 'winston-logger', type: 'logger', level: this.level };
  }

  /**
   * 支持创建子 logger，实现 context 级别日志隔离
   */
  createChildLogger(meta: Record<string, any>): WinstonLogger {
    return this.logger.child(meta);
  }
}
