// 多实现 EmailService 适配器注册表
import type { IEmailService, EmailProviderType, EmailConfig } from '../types/email-types';
import { MockEmailAdapter } from '../adapters/mock-email-adapter';
import { SmtpEmailAdapter } from '../adapters/smtp-email-adapter';
import { SendgridEmailAdapter } from '../adapters/sendgrid-email-adapter';
import { ResendEmailAdapter } from '../adapters/resend-email-adapter';
import { AliyunEmailAdapter } from '../adapters/aliyun-email-adapter';

export class EmailRegistry {
  private static adapters: Record<EmailProviderType, (config?: EmailConfig) => IEmailService> = {
    mock: () => MockEmailAdapter.getInstance(),
    smtp: () => SmtpEmailAdapter.getInstance(),
    sendgrid: (config?: EmailConfig) => SendgridEmailAdapter.getInstance(config),
    resend: (config?: EmailConfig) => ResendEmailAdapter.getInstance(config),
    aliyun: (config?: EmailConfig) => AliyunEmailAdapter.getInstance(config),
    default: () => MockEmailAdapter.getInstance(),
  };

  static registerAdapter(provider: EmailProviderType, factory: (config?: EmailConfig) => IEmailService) {
    this.adapters[provider] = factory;
  }
  static getAdapter(provider: EmailProviderType, config?: EmailConfig): IEmailService | undefined {
    const factory = this.adapters[provider];
    return factory ? factory(config) : undefined;
  }
  static isAdapterRegistered(provider: EmailProviderType): boolean {
    return !!this.adapters[provider];
  }
  static getAvailableProviders(): EmailProviderType[] {
    return Object.keys(this.adapters) as EmailProviderType[];
  }
}

export function getEmailService(): IEmailService {
  const provider = process.env.EMAIL_PROVIDER || 'default';
  if (EmailRegistry.isAdapterRegistered(provider)) {
    return EmailRegistry.getAdapter(provider)!;
  } else {
    throw new Error(`Email provider ${provider} is not registered`);
  }
}
