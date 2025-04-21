// 多实现 EmailService 适配器注册表
import { IEmailService } from '@/core/services/infrastructure/types';
import { EmailService } from '@core/services/infrastructure/email/service/email-service';
import { MockEmailAdapter } from '@core/services/infrastructure/email/adapters/mock-email-adapter';
import { SmtpEmailAdapter } from '@core/services/infrastructure/email/adapters/smtp-email-adapter';

let instance: IEmailService;

export function getEmailService(): IEmailService {
  if (!instance) {
    if (process.env.NODE_ENV === 'test') {
      instance = MockEmailAdapter.getInstance();
    } else if (process.env.EMAIL_PROVIDER === 'smtp') {
      instance = SmtpEmailAdapter.getInstance();
    } else {
      instance = EmailService.getInstance();
    }
  }
  return instance;
}
