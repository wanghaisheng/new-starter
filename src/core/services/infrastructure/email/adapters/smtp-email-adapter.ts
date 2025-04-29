// SmtpEmailAdapter: 真实 SMTP 邮件服务适配器
import { IEmailService, EmailOptions, InfrastructureServiceConfig } from '@/core/services/infrastructure/types';
import { InfrastructureServiceType } from '@/core/lib/db/types/common';

export class SmtpEmailAdapter implements IEmailService {
  private static instance: SmtpEmailAdapter;
  private _isInitialized = false;
  private config: InfrastructureServiceConfig = { id: 'smtp-email', type: 'email' };

  private constructor() {}

  static getInstance(): SmtpEmailAdapter {
    if (!SmtpEmailAdapter.instance) {
      SmtpEmailAdapter.instance = new SmtpEmailAdapter();
    }
    return SmtpEmailAdapter.instance;
  }

  async initialize(): Promise<void> { this._isInitialized = true; }
  async dispose(): Promise<void> { this._isInitialized = false; }
  isInitialized(): boolean { return this._isInitialized; }
  getServiceType(): InfrastructureServiceType { return InfrastructureServiceType.EMAIL; }
  getConfig(): InfrastructureServiceConfig { return this.config; }

  async sendEmail(options: EmailOptions): Promise<void> {
    // TODO: 真实 SMTP 邮件发送逻辑（如 nodemailer）
    throw new Error('SMTP 邮件适配器未实现实际发送逻辑');
  }
}
