// logger-factory.ts
import { LoggerService } from '../service/logger-service';
import { LogLevel, ILoggerService } from '@/core/services/infrastructure/logger/types/logger-types';

export function createLoggerService(env: string = process.env.NODE_ENV || 'development', level: LogLevel = 'INFO'): ILoggerService {
  // 可扩展：根据 env 返回 mock/真实实现
  return LoggerService.getInstance();
}
