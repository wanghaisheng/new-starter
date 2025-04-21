// email-factory.ts
import { EmailService } from '../service/email-service';
import { IEmailService } from '@/core/services/infrastructure/types';

export function createEmailService(): IEmailService {
  return EmailService.getInstance();
}
