// resend-email-adapter.ts
import type { IEmailService, EmailConfig } from '../types/email-types';

export class ResendEmailAdapter implements IEmailService {
  private static instance: ResendEmailAdapter;
  private _isInitialized = false;
  private config: EmailConfig;

  private constructor(config: EmailConfig = {}) {
    this.config = config;
  }

  static getInstance(config: EmailConfig = {}): ResendEmailAdapter {
    if (!ResendEmailAdapter.instance) {
      ResendEmailAdapter.instance = new ResendEmailAdapter(config);
    }
    return ResendEmailAdapter.instance;
  }

  async initialize(): Promise<void> { this._isInitialized = true; }
  async dispose(): Promise<void> { this._isInitialized = false; }
  isInitialized(): boolean { return this._isInitialized; }

  async sendEmail(options: any): Promise<void> {
    // 这里只做演示，实际可集成 resend 官方 SDK
    console.log('[ResendEmailAdapter] 发送邮件:', options, '配置:', this.config);
  }
}
