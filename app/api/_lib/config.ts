import { ApiConfig, ApiEnvironment, ApiPlatform, ApiVersion } from './types';

// API 环境配置
const environment: ApiEnvironment = (process.env.NODE_ENV as ApiEnvironment) || 'development';

// API 平台配置
const platform: ApiPlatform = process.env.NEXT_PUBLIC_PLATFORM as ApiPlatform || 'web';

// API 版本配置
const version: ApiVersion = 'v1';

// 基础 API 配置
const baseConfig: ApiConfig = {
  auth: {
    required: true,
    roles: ['user', 'admin']
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
  },
  errorHandler: {
    logErrors: environment !== 'production',
    includeStackTrace: environment !== 'production'
  },
  cache: {
    enabled: true,
    maxAge: 60 * 60, // 1 hour
    staleWhileRevalidate: 24 * 60 * 60 // 24 hours
  }
};

// 环境特定配置
const environmentConfig: Record<ApiEnvironment, Partial<ApiConfig>> = {
  development: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000 // 开发环境允许更多请求
    },
    errorHandler: {
      logErrors: true,
      includeStackTrace: true
    }
  },
  staging: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 500
    },
    errorHandler: {
      logErrors: true,
      includeStackTrace: false
    }
  },
  production: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    },
    errorHandler: {
      logErrors: false,
      includeStackTrace: false
    }
  }
};

// 平台特定配置
const platformConfig: Record<ApiPlatform, Partial<ApiConfig>> = {
  web: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    }
  },
  mobile: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 200 // 移动端允许更多请求
    }
  },
  desktop: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    }
  }
};

// 合并配置
export const apiConfig: ApiConfig = {
  ...baseConfig,
  ...environmentConfig[environment],
  ...platformConfig[platform]
};

// API 基础 URL
export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// API 版本前缀
export const apiVersionPrefix = `/api/${version}`;

// API 平台前缀
export const apiPlatformPrefix = `/api/${platform}`;

// API 完整前缀
export const apiPrefix = `${apiVersionPrefix}${apiPlatformPrefix}`;

// 导出配置
export {
  environment,
  platform,
  version
}; 