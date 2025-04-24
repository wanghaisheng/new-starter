import pino, { Logger as PinoLogger, LoggerOptions as PinoLoggerOptions } from 'pino';
import { LogLevel, ILoggerService, InfrastructureServiceType, InfrastructureServiceConfig } from '@/core/services/infrastructure/logger/types/logger-types';

/**
 * Pino 日志适配器，兼容 ILoggerService，支持 JSON 格式、动态 level、结构化日志。
 * 支持扩展输出目标（如文件/远程）、child logger、格式化等高级特性。
 */
export class PinoLoggerAdapter implements ILoggerService {
  private static instance: PinoLoggerAdapter;
  private logger: PinoLogger;
  private initialized = false;
  private level: LogLevel = 'INFO';

  private constructor() {
    const options: PinoLoggerOptions = {
      level: this.level.toLowerCase(),
      formatters: {
        level(label: string) {
          return { level: label };
        }
      },
      timestamp: pino.stdTimeFunctions.isoTime
    };
    this.logger = pino(options);
  }

  static getInstance() {
    if (!PinoLoggerAdapter.instance) {
      PinoLoggerAdapter.instance = new PinoLoggerAdapter();
    }
    return PinoLoggerAdapter.instance;
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
    this.logger.debug({ args }, message);
  }
  info(message: string, ...args: any[]): void {
    this.logger.info({ args }, message);
  }
  warn(message: string, ...args: any[]): void {
    this.logger.warn({ args }, message);
  }
  error(message: string, ...args: any[]): void {
    this.logger.error({ args }, message);
  }
  getServiceType(): InfrastructureServiceType {
    return InfrastructureServiceType.LOGGER;
  }
  getConfig(): InfrastructureServiceConfig {
    return { id: 'pino-logger', type: 'logger', level: this.level };
  }

  /**
   * 支持创建子 logger，实现 context 级别日志隔离
   */
  createChildLogger(bindings: Record<string, any>): PinoLogger {
    return this.logger.child(bindings);
  }
}
