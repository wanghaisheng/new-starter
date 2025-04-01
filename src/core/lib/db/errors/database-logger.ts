/**
 * 数据库日志记录器
 * 提供统一的日志记录接口，用于数据库操作的调试和错误追踪
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  /**
   * 是否启用日志
   * @default true
   */
  enabled?: boolean;
  
  /**
   * 最低日志级别
   * @default LogLevel.INFO
   */
  minLevel?: LogLevel;
  
  /**
   * 是否在控制台输出
   * @default true
   */
  consoleOutput?: boolean;
  
  /**
   * 是否包含时间戳
   * @default true
   */
  includeTimestamp?: boolean;
  
  /**
   * 是否包含日志来源（模块名）
   * @default true
   */
  includeSource?: boolean;
}

/**
 * 全局日志配置
 */
let globalConfig: LoggerConfig = {
  enabled: true,
  minLevel: LogLevel.INFO,
  consoleOutput: true,
  includeTimestamp: true,
  includeSource: true
};

/**
 * 设置全局日志配置
 * @param config 日志配置
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * 数据库日志记录器类
 */
export class DatabaseLogger {
  private source: string;
  
  /**
   * 创建数据库日志记录器实例
   * @param source 日志来源模块名
   */
  constructor(source: string) {
    this.source = source;
  }
  
  /**
   * 记录调试级别日志
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  /**
   * 记录信息级别日志
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  /**
   * 记录警告级别日志
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  /**
   * 记录错误级别日志
   * @param message 日志消息
   * @param error 错误对象或附加数据（可选）
   */
  public error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, error);
  }
  
  /**
   * 记录日志
   * @param level 日志级别
   * @param message 日志消息
   * @param data 附加数据（可选）
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // 检查日志是否启用
    if (!globalConfig.enabled) {
      return;
    }
    
    // 检查日志级别
    if (!this.shouldLog(level)) {
      return;
    }
    
    // 格式化日志前缀
    const prefix = this.formatPrefix(level);
    
    // 输出到控制台
    if (globalConfig.consoleOutput) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(prefix, message, data ? data : '');
          break;
        case LogLevel.INFO:
          console.info(prefix, message, data ? data : '');
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, data ? data : '');
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, data ? data : '');
          break;
      }
    }
  }
  
  /**
   * 检查日志级别是否应该记录
   * @param level 日志级别
   * @returns 是否应该记录
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(globalConfig.minLevel || LogLevel.INFO);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
  
  /**
   * 格式化日志前缀
   * @param level 日志级别
   * @returns 格式化后的前缀
   */
  private formatPrefix(level: LogLevel): string {
    let prefix = '';
    
    // 添加时间戳
    if (globalConfig.includeTimestamp) {
      const now = new Date();
      prefix += `[${now.toISOString()}] `;
    }
    
    // 添加日志级别
    prefix += `[${level.toUpperCase()}]`;
    
    // 添加来源
    if (globalConfig.includeSource && this.source) {
      prefix += ` [${this.source}]`;
    }
    
    return prefix;
  }
}

/**
 * 获取或创建日志记录器
 * @param source 日志来源模块名
 * @returns 日志记录器实例
 */
export function getLogger(source: string): DatabaseLogger {
  return new DatabaseLogger(source);
}

/**
 * 获取全局日志配置
 * @returns 当前日志配置
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...globalConfig };
} 