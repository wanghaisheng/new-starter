// ConfigService 单例注册表
import { ConfigService } from '@/core/services/infrastructure/config/service/config-service';

class ConfigRegistry {
  private static instance: ConfigService;
  static getInstance() {
    if (!ConfigRegistry.instance) {
      ConfigRegistry.instance = ConfigService.getInstance();
    }
    return ConfigRegistry.instance;
  }
}

export { ConfigRegistry };
