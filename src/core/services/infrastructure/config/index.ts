// config/index.ts
import { createConfigAdapter } from './factory/config-factory';
import { ConfigService } from './service/config-service';

const configAdapter = createConfigAdapter();
const configService = ConfigService.getInstance(configAdapter);

export { configService, configAdapter };
