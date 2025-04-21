// 多实现 LoggerService 适配器注册表
import { ILoggerService } from '@/core/services/infrastructure/types';
import { LoggerService } from '../service/logger-service';
import { MockLoggerAdapter } from '../adapters/mock-adapter';
import { WinstonLoggerAdapter } from '../adapters/winston-adapter';

let instance: ILoggerService;

export function getLoggerService(): ILoggerService {
  if (!instance) {
    if (process.env.NODE_ENV === 'test') {
      instance = MockLoggerAdapter.getInstance();
    } else if (process.env.LOGGER_PROVIDER === 'winston') {
      instance = WinstonLoggerAdapter.getInstance();
    } else {
      instance = LoggerService.getInstance();
    }
  }
  return instance;
}
