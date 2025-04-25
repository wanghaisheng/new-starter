// aliyun-email-adapter.ts
import type { IEmailService, EmailConfig } from '../types/email-types';

export class AliyunEmailAdapter implements IEmailService {
  private static instance: AliyunEmailAdapter;
  private _isInitialized = false;
  private config: EmailConfig;

  private constructor(config: EmailConfig = {}) {
    this.config = config;
  }

  static getInstance(config: EmailConfig = {}): AliyunEmailAdapter {
    if (!AliyunEmailAdapter.instance) {
      AliyunEmailAdapter.instance = new AliyunEmailAdapter(config);
    }
    return AliyunEmailAdapter.instance;
  }

  async initialize(): Promise<void> { this._isInitialized = true; }
  async dispose(): Promise<void> { this._isInitialized = false; }
  isInitialized(): boolean { return this._isInitialized; }

  async sendEmail(options: any): Promise<void> {
    // 这里只做演示，实际可集成阿里云邮件推送 SDK
    console.log('[AliyunEmailAdapter] 发送邮件:', options, '配置:', this.config);
  }
}
