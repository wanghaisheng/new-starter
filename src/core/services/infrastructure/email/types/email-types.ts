// email-types.ts
export type EmailProviderType = 'mock' | 'smtp' | 'default' | string;

export interface EmailConfig {
  provider?: EmailProviderType;
  [key: string]: any;
}

export interface IEmailService {
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  isInitialized(): boolean;
  sendEmail(options: any): Promise<void>;
}
