// EmailService 实现
import { IEmailService, InfrastructureServiceType, InfrastructureServiceConfig, EmailOptions } from '@/core/services/infrastructure/types';

export class EmailService implements IEmailService {
  private static instance: EmailService;
  private _isInitialized = false;
  private config: InfrastructureServiceConfig = { id: 'email', type: 'email' };

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async initialize(): Promise<void> { this._isInitialized = true; }
  async dispose(): Promise<void> { this._isInitialized = false; }
  isInitialized(): boolean { return this._isInitialized; }
  getServiceType(): InfrastructureServiceType { return InfrastructureServiceType.EMAIL; }
  getConfig(): InfrastructureServiceConfig { return this.config; }

  async sendEmail(options: EmailOptions): Promise<void> {
    // 可根据环境扩展真实/模拟发送
    if (process.env.NODE_ENV === 'development') {
      console.log('开发环境：模拟发送邮件', options);
    } else {
      // 真实邮件发送逻辑
      // throw new Error('未实现真实邮件发送');
    }
  }
}

export * from '../index';
