/**
 * 认证服务配置
 * 用于设置认证服务的类型和相关参数
 */

import { AuthServiceType } from '@/core/services/auth-service';

/**
 * 认证服务配置
 */
export interface AuthConfig {
  /** 认证服务类型 */
  type: AuthServiceType;
  
  /** Firebase配置 */
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  
  /** Better Auth配置 */
  better?: {
    apiKey: string;
    apiUrl: string;
  };
  
  /** Mock Auth配置 */
  mock?: {
    enabled: boolean;
    users: string; // 格式: "email:password,email2:password2"
    phones: string; // 格式: "phone:code,phone2:code2"
  };
}

/**
 * 默认配置
 */
const defaultConfig: AuthConfig = {
  type: 'better',
  better: {
    apiKey: process.env.NEXT_PUBLIC_BETTER_AUTH_API_KEY || '',
    apiUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_API_URL || 'https://api.better-auth.com',
  },
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  },
  mock: {
    enabled: process.env.NEXT_PUBLIC_MOCK_AUTH_ENABLED === 'true',
    users: process.env.NEXT_PUBLIC_MOCK_AUTH_USERS || '',
    phones: process.env.NEXT_PUBLIC_MOCK_AUTH_PHONES || '',
  },
};

/**
 * 获取当前环境的认证服务类型
 */
export function getAuthServiceType(): AuthServiceType {
  const env = process.env.NEXT_PUBLIC_AUTH_SERVICE_TYPE as AuthServiceType;
  return env || defaultConfig.type;
}

/**
 * 获取认证服务配置
 */
export function getAuthConfig(): AuthConfig {
  return {
    ...defaultConfig,
    type: getAuthServiceType(),
  };
}

/**
 * 初始化认证服务
 */
export function initializeAuthService(): void {
  const config = getAuthConfig();
  const { AuthServiceFactory } = require('@/core/services/auth-service');
  AuthServiceFactory.getInstance().setServiceType(config.type);
}

/**
 * 验证 Firebase 配置
 */
function validateFirebaseConfig(): void {
  const requiredFields = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];

  const missingFields = requiredFields.filter(field => !process.env[field]);
  if (missingFields.length > 0) {
    console.warn('Missing required Firebase configuration:', missingFields);
  }
}

/**
 * 验证 Better Auth 配置
 */
function validateBetterAuthConfig(): void {
  const requiredFields = [
    'NEXT_PUBLIC_BETTER_AUTH_API_KEY',
    'NEXT_PUBLIC_BETTER_AUTH_API_URL'
  ];

  const missingFields = requiredFields.filter(field => !process.env[field]);
  if (missingFields.length > 0) {
    console.warn('Missing required Better Auth configuration:', missingFields);
  }
} 