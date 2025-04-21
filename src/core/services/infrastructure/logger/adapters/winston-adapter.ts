// winston-adapter.ts
import { createLogger, format, transports } from 'winston';
import { LogLevel } from '@/core/services/infrastructure/logger/types/logger-types';
import { ILoggerService } from '@/core/services/infrastructure/types';

const { combine, timestamp, json, colorize, simple } = format;
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const loggerTransports: any[] = [
  new transports.Console({
    format: combine(colorize(), simple())
  })
];
if (!isBrowser) {
  loggerTransports.push(
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  );
}

export function createWinstonLogger(level: LogLevel = 'INFO') {
  return createLogger({
    level: level.toLowerCase(),
    format: combine(timestamp(), json()),
    transports: loggerTransports
  });
}

export class WinstonLoggerAdapter implements ILoggerService {
  private static instance: WinstonLoggerAdapter;
  private logger: any;

  private constructor() {
    this.logger = createWinstonLogger();
  }

  static getInstance() {
    if (!WinstonLoggerAdapter.instance) {
      WinstonLoggerAdapter.instance = new WinstonLoggerAdapter();
    }
    return WinstonLoggerAdapter.instance;
  }

  debug(...args: any[]): void {
    this.logger.debug(...args);
  }

  info(...args: any[]): void {
    this.logger.info(...args);
  }

  warn(...args: any[]): void {
    this.logger.warn(...args);
  }

  error(...args: any[]): void {
    this.logger.error(...args);
  }
}
