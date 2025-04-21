/**
 * 数据库日志记录器（基于全局 LoggerService 实现）
 * 统一数据库领域日志输出，支持自定义 source/moduleName
 */
import { LoggerService } from '@/core/services/infrastructure/logger/service/logger-service';
import type { LogLevel } from '@/core/services/infrastructure/logger/types/logger-types';

/**
 * 日志配置接口（兼容旧版，预留扩展）
 */
export interface LoggerConfig {
  enabled?: boolean;
  minLevel?: LogLevel;
  includeSource?: boolean;
}

/**
 * 数据库日志记录器类
 */
export class DatabaseLogger {
  private source: string;
  private logger: LoggerService;

  /**
   * 创建数据库日志记录器实例
   * @param source 日志来源模块名
   */
  constructor(source: string = 'database') {
    this.source = source;
    this.logger = LoggerService.getInstance();
  }

  /**
   * 记录调试级别日志
   */
  public debug(message: string, data?: any): void {
    this.logger.debug(this.formatMsg(message), { source: this.source, ...data });
  }

  /**
   * 记录信息级别日志
   */
  public info(message: string, data?: any): void {
    this.logger.info(this.formatMsg(message), { source: this.source, ...data });
  }

  /**
   * 记录警告级别日志
   */
  public warn(message: string, data?: any): void {
    this.logger.warn(this.formatMsg(message), { source: this.source, ...data });
  }

  /**
   * 记录错误级别日志
   */
  public error(message: string, error?: any): void {
    this.logger.error(this.formatMsg(message), { source: this.source, error });
  }

  /**
   * 可选：设置日志级别
   */
  public setLevel(level: LogLevel): void {
    this.logger.setLevel(level);
  }

  /**
   * 格式化日志消息，自动加上 source
   */
  private formatMsg(message: string): string {
    return `[${this.source}] ${message}`;
  }
}

/**
 * 工厂方法：获取数据库日志记录器
 */
export function getDatabaseLogger(source: string = 'database'): DatabaseLogger {
  return new DatabaseLogger(source);
}