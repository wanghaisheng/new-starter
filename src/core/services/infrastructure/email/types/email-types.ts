// email-types.ts
import { EmailProvider } from '@/core/lib/db/types/common';

export type EmailProviderType = typeof EmailProvider[keyof typeof EmailProvider];

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
