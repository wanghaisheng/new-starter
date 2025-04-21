// error-factory.ts
import { ErrorService } from '../service/error-service';
import { ErrorLevel, IErrorService } from '@/core/services/infrastructure/error/types/error-types';

export function createErrorService(env: string = process.env.NODE_ENV || 'development', level: ErrorLevel = 'ERROR'): IErrorService {
  // 可扩展：根据 env 返回 mock/真实实现
  return ErrorService.getInstance();
}
