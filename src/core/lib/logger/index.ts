import { createLogger, format, transports } from 'winston';

const { combine, timestamp, json, colorize, simple } = format;

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        simple()
      )
    }),
    new transports.File({ 
      filename: 'logs/error.log',
      level: 'error'
    }),
    new transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
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