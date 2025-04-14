import { createLogger, format, transports } from 'winston';

const { combine, timestamp, json, colorize, simple } = format;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Create logger with appropriate transports based on environment
const loggerTransports: any[] = [
  new transports.Console({
    format: combine(
      colorize(),
      simple()
    )
  })
];

// Only add file transports in Node.js environment
if (!isBrowser) {
  loggerTransports.push(
    new transports.File({ 
      filename: 'logs/error.log',
      level: 'error'
    }),
    new transports.File({ 
      filename: 'logs/combined.log' 
    })
  );
}

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: loggerTransports
});

// 导出日志级别类型
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// 导出日志方法
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta)
}; 