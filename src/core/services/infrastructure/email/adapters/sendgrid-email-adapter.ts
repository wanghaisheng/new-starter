// sendgrid-email-adapter.ts
import type { IEmailService, EmailConfig } from '../types/email-types';

export class SendgridEmailAdapter implements IEmailService {
  private static instance: SendgridEmailAdapter;
  private _isInitialized = false;
  private config: EmailConfig;

  private constructor(config: EmailConfig = {}) {
    this.config = config;
  }

  static getInstance(config: EmailConfig = {}): SendgridEmailAdapter {
    if (!SendgridEmailAdapter.instance) {
      SendgridEmailAdapter.instance = new SendgridEmailAdapter(config);
    }
    return SendgridEmailAdapter.instance;
  }

  async initialize(): Promise<void> { this._isInitialized = true; }
  async dispose(): Promise<void> { this._isInitialized = false; }
  isInitialized(): boolean { return this._isInitialized; }

  async sendEmail(options: any): Promise<void> {
    // 这里只做演示，实际可集成 sendgrid 官方 SDK
    console.log('[SendgridEmailAdapter] 发送邮件:', options, '配置:', this.config);
  }
}
