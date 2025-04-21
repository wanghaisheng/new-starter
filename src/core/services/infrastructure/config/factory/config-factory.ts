// config-factory.ts
import { ConfigService } from '@/core/services/infrastructure/config/service/config-service';
import { IConfigService } from '@/core/services/infrastructure/types';

export function createConfigService(): IConfigService {
  return ConfigService.getInstance();
}
