// logger-service.ts
import { LogLevel, ILoggerService, InfrastructureServiceConfig } from '@/core/services/infrastructure/logger/types/logger-types';
import { InfrastructureServiceType } from '@/core/lib/db/types/common';
import { createLogger, format, transports } from 'winston';
import { getConfigService } from '@/core/services/infrastructure/config';

const { combine, timestamp, json } = format;
const logger = createLogger({
  level: getConfigService().get('LOG_LEVEL') || 'INFO',
  format: combine(timestamp(), json()),
  transports: [new transports.Console()]
});

export class LoggerService implements ILoggerService {
  private static instance: LoggerService;
  private config: InfrastructureServiceConfig;
  private _isInitialized = false;
  private logLevel: LogLevel = 'INFO';

  private constructor() {
    this.config = { id: 'logger', type: InfrastructureServiceType.LOGGER };
  }

  async initialize(): Promise<void> { this._isInitialized = true; }
  async dispose(): Promise<void> { this._isInitialized = false; }
  isInitialized(): boolean { return this._isInitialized; }
  setLevel(level: LogLevel): void { this.logLevel = level; logger.level = level; }
  debug(message: string, ...args: any[]): void { if (this.logLevel === 'DEBUG') logger.debug(message, ...args); }
  info(message: string, ...args: any[]): void { if (['INFO','DEBUG'].includes(this.logLevel)) logger.info(message, ...args); }
  warn(message: string, ...args: any[]): void { if (['WARN','INFO','DEBUG'].includes(this.logLevel)) logger.warn(message, ...args); }
  error(message: string, ...args: any[]): void { logger.error(message, ...args); }
  getServiceType(): InfrastructureServiceType { return InfrastructureServiceType.LOGGER; }
  getType(): string { return 'winston-logger'; }
  getConfig(): InfrastructureServiceConfig { return this.config; }
  static getInstance(): LoggerService {
    if (!LoggerService.instance) LoggerService.instance = new LoggerService();
    return LoggerService.instance;
  }
}
