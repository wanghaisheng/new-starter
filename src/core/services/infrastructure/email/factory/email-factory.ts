// email-factory.ts
import type { IEmailService, EmailProviderType, EmailConfig } from '../types/email-types';
import { EmailRegistry } from '../registry/email-registry';
import { getConfigService } from '@/core/services/infrastructure/config';
import { CONFIG_KEYS } from '@/core/services/infrastructure/config/config-keys';

export class EmailFactory {
  static createEmailService(config: EmailConfig = {}): IEmailService {
    let provider: EmailProviderType;
    let configService: any = undefined;
    try {
      configService = getConfigService?.();
    } catch (e) { configService = undefined; }
    provider =
      config.provider ||
      (configService?.get?.(CONFIG_KEYS.EMAIL_PROVIDER)) ||
      process.env[CONFIG_KEYS.EMAIL_PROVIDER] ||
      'default';

    if (!provider) provider = 'default';

    const service = EmailRegistry.getAdapter(provider, config) || EmailRegistry.getAdapter('default', config);
    if (!service) throw new Error(`[EmailFactory] 未找到有效 email provider: ${provider}`);
    return service;
  }

  static registerAdapter(provider: EmailProviderType, factory: (config?: EmailConfig) => IEmailService) {
    EmailRegistry.registerAdapter(provider, factory);
  }
}
