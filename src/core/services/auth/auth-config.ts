// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Import Node.js modules only in non-browser environments
let scrypt: any;
let randomBytes: any;
let promisify: any;

if (!isBrowser) {
  // Node.js environment
  const crypto = require('crypto');
  const util = require('util');
  scrypt = crypto.scrypt;
  randomBytes = crypto.randomBytes;
  promisify = util.promisify;
} else {
  // Browser environment - provide mock implementations
  scrypt = async (password: string, salt: string, keylen: number) => {
    // In a real implementation, you would use the Web Crypto API
    // This is just a placeholder that returns a mock value
    console.warn('Using mock crypto implementation in browser');
    return new Uint8Array(keylen).fill(1);
  };
  
  randomBytes = (size: number) => {
    // In a real implementation, you would use the Web Crypto API
    // This is just a placeholder that returns a mock value
    console.warn('Using mock randomBytes implementation in browser');
    return Buffer.from(new Uint8Array(size).fill(1));
  };
  
  promisify = (fn: Function) => fn;
}

import { sendEmail } from '@/core/lib/email';
import { AuthConfig, EmailContext, RequestContext, AuthServiceType, AuthProviderType } from './auth-types';

const scryptAsync = promisify(scrypt);

/**
 * 获取当前认证服务类型
 */
export const getAuthServiceType = (): AuthServiceType => {
  const env = process.env.NEXT_PUBLIC_AUTH_SERVICE_TYPE || 'mock';
  return env as AuthServiceType;
};

/**
 * 检查认证方法是否启用
 */
export const isAuthMethodEnabled = (method: AuthProviderType): boolean => {
  const config = authConfig[method];
  return config?.enabled ?? false;
};

/**
 * 获取所有启用的认证方法
 */
export const getEnabledAuthMethods = (): AuthProviderType[] => {
  return Object.entries(authConfig)
    .filter(([_, config]) => config.enabled)
    .map(([method]) => method as AuthProviderType);
};

/**
 * 获取认证配置
 */
export const getAuthConfig = () => authConfig;

export const authConfig: AuthConfig = {
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 100,
    resetPasswordTokenExpiresIn: 24 * 60 * 60 * 1000, // 24 hours
    
    password: {
      async hash(password: string): Promise<string> {
        const salt = randomBytes(16).toString('hex');
        const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
        return salt + ':' + derivedKey.toString('hex');
      },
      
      async verify(password: string, hash: string): Promise<boolean> {
        const [salt, key] = hash.split(':');
        const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
        return key === derivedKey.toString('hex');
      }
    },

    async sendResetPassword(context: EmailContext, request: RequestContext): Promise<void> {
      const { user, url, token } = context;
      
      await sendEmail({
        to: user.email!,
        subject: 'Reset Your Password',
        text: `Click this link to reset your password: ${url}?token=${token}`,
        html: `
          <h1>Reset Your Password</h1>
          <p>Click the button below to reset your password:</p>
          <a href="${url}?token=${token}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>If you did not request this password reset, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>IP: ${request.ip}</p>
          <p>User Agent: ${request.userAgent}</p>
        `
      });
    },

    async sendVerificationEmail(context: EmailContext, request: RequestContext): Promise<void> {
      const { user, url, token } = context;
      
      await sendEmail({
        to: user.email!,
        subject: 'Verify Your Email',
        text: `Click this link to verify your email: ${url}?token=${token}`,
        html: `
          <h1>Verify Your Email</h1>
          <p>Click the button below to verify your email address:</p>
          <a href="${url}?token=${token}" style="padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>If you did not create an account, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>IP: ${request.ip}</p>
          <p>User Agent: ${request.userAgent}</p>
        `
      });
    }
  },
  phone: {
    enabled: true
  },
  google: {
    enabled: true
  },
  facebook: {
    enabled: true
  },
  apple: {
    enabled: true
  }
}; 