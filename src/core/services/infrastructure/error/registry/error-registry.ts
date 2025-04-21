// error-registry.ts
import { IErrorService, ErrorServiceType } from '@/core/services/infrastructure/error/types/error-types';
import { ErrorService } from '../service/error-service';
import { MockErrorAdapter } from '../adapters/mock-adapter';

let instance: IErrorService;

export function getErrorService(): IErrorService {
  if (!instance) {
    if (process.env.NODE_ENV === 'test') {
      instance = MockErrorAdapter.getInstance();
    } else {
      instance = ErrorService.getInstance();
    }
  }
  return instance;
}
